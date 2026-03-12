import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function fixSellerFulfillment({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  const ADMIN_HANDLE = "admin-store";

  try {
    // 1. Get the Admin Seller
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id"],
      filters: { handle: ADMIN_HANDLE },
    });
    const sellerId = sellers[0]?.id;

    if (!sellerId) {
      logger.error("❌ Admin Seller not found. Run setup script first.");
      return;
    }

    // 2. Get all Stock Locations
    // In Medusa v2, products and shipping are tied to locations.
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
    });

    if (locations.length === 0) {
      logger.warn(
        "⚠️ No Stock Locations found. Check your Medusa Admin settings.",
      );
    }

    // 3. Link Seller to Locations
    for (const location of locations) {
      try {
        await remoteLink.create({
          seller: { seller_id: sellerId },
          [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
        });
        logger.info(`✅ Linked Admin Seller to Location: ${location.name}`);
      } catch (e) {
        logger.info(`ℹ️ Seller already linked to location: ${location.name}`);
      }
    }

    // 4. Ensure Shipping Options are fully accessible
    const { data: shippingOptions } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "name", "fulfillment_set_id"],
    });

    for (const option of shippingOptions) {
      try {
        // Link seller directly to the fulfillment set of the shipping option
        await remoteLink.create({
          seller: { seller_id: sellerId },
          [Modules.FULFILLMENT]: {
            fulfillment_set_id: option.fulfillments[0].id,
          },
        });
        logger.info(
          `✅ Linked Admin Seller to Fulfillment Set for: ${option.name}`,
        );
      } catch (e) {
        // Likely already linked
      }
    }

    logger.info(
      "🚀 Fulfillment infrastructure linked! Please RESTART your dev server.",
    );
  } catch (error: any) {
    logger.error(`❌ Fulfillment Fix Failed: ${error.message}`);
  }
}
