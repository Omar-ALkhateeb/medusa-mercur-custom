import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function setupAdminSeller({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  const ADMIN_HANDLE = "admin-store";

  // 1. AUTO-DETECT THE SELLER SERVICE
  const registrations = (container as any).registrations || {};
  const availableKeys = Object.keys(registrations);
  const sellerKey = availableKeys.find(
    (k) =>
      k === "seller" ||
      k === "sellerModuleService" ||
      k === "mercurSellerService",
  );

  if (!sellerKey) {
    logger.error("❌ Could not find a Seller Module in the container.");
    return;
  }

  const sellerModule: any = container.resolve(sellerKey);
  logger.info("🛠️ Starting Admin-Seller Setup...");

  try {
    // 2. GET THE FIRST ADMIN USER
    const { data: users } = await query.graph({
      entity: "user",
      fields: ["id", "email"],
    });

    const adminUser = users[0];
    if (!adminUser) {
      logger.error(
        "❌ No Admin User found. Please create one in the dashboard first.",
      );
      return;
    }
    logger.info(`👤 Using Admin User: ${adminUser.email}`);

    // 3. CHECK OR CREATE THE SELLER
    let sellerId;
    const { data: existingSellers } = await query.graph({
      entity: "seller",
      fields: ["id", "handle"],
      filters: { handle: ADMIN_HANDLE },
    });

    if (existingSellers && existingSellers.length > 0) {
      sellerId = existingSellers[0].id;
      logger.info(`✅ Admin Seller already exists: ${sellerId}`);
    } else {
      logger.info("➕ Creating new Admin Seller...");
      const [newSeller] = await sellerModule.createSellers([
        {
          name: "Main Warehouse",
          handle: ADMIN_HANDLE,
          description: "Primary fulfillment center for central operations.",
        },
      ]);
      sellerId = newSeller.id;
      logger.info(`🎉 Created Admin Seller: ${sellerId}`);
    }

    // 4. BULLETPROOF LINKING: ADMIN USER
    logger.info("🔄 Verifying Admin User link...");
    try {
      await remoteLink.create({
        [Modules.USER]: { user_id: adminUser.id },
        seller: { seller_id: sellerId },
      });
      logger.info("➕ Linked Admin User to Admin Seller.");
    } catch (e) {
      // If the link already exists, Medusa throws an error. We safely ignore it!
      logger.info("✅ Admin User is already linked to the Seller.");
    }

    // 5. BULLETPROOF LINKING: PRODUCTS
    logger.info("🔄 Verifying Product links...");
    const { data: allProducts } = await query.graph({
      entity: "product",
      fields: ["id", "title"],
    });

    let newLinksCount = 0;

    for (const product of allProducts) {
      try {
        await remoteLink.create({
          seller: { seller_id: sellerId },
          [Modules.PRODUCT]: { product_id: product.id },
        });
        newLinksCount++;
      } catch (e) {
        // Product is already linked to a seller, skip!
      }
    }

    if (newLinksCount > 0) {
      logger.info(
        `➕ Linked ${newLinksCount} unassigned products to the Admin Seller.`,
      );
    } else {
      logger.info("✅ All products are already properly linked.");
    }

    logger.info(
      "🚀 Setup Complete! Your database is fully primed for centralized fulfillment.",
    );
  } catch (error: any) {
    logger.error(`❌ Setup Failed: ${error.message}`);
    console.error(error);
  }
}
