import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function linkAdminShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  const ADMIN_HANDLE = "admin-store";

  logger.info("🚚 Linking Global Shipping Options to Admin Seller...");

  try {
    // 1. Find the Admin Seller
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id"],
      filters: { handle: ADMIN_HANDLE },
    });

    const sellerId = sellers[0]?.id;
    if (!sellerId) {
      logger.error(
        "❌ Admin Seller not found. Run the setup-admin-seller script first.",
      );
      return;
    }

    // 2. Find all Shipping Options
    const { data: shippingOptions } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "name"],
    });

    if (shippingOptions.length === 0) {
      logger.error(
        "❌ No Shipping Options found. Please create one in Medusa Admin settings first.",
      );
      return;
    }

    logger.info(`🔍 Found ${shippingOptions.length} global shipping options.`);

    // 3. Link them to the Seller
    let linkCount = 0;
    for (const option of shippingOptions) {
      try {
        await remoteLink.create({
          seller: { seller_id: sellerId },
          [Modules.FULFILLMENT]: { shipping_option_id: option.id },
        });
        linkCount++;
        logger.info(`✅ Linked: ${option.name}`);
      } catch (e) {
        // Already linked, skip
      }
    }

    logger.info(
      `🎉 Successfully linked ${linkCount} options to the Admin Seller.`,
    );
    logger.info("🚀 You can now complete the checkout in the app!");
  } catch (error: any) {
    logger.error(`❌ Shipping Link Failed: ${error.message}`);
  }
}
