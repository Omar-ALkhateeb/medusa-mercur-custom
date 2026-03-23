import { ExecArgs } from "@medusajs/framework/types";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";

export default async function seedMockData({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const query = container.resolve("query"); // The v2 Graph Query engine

  logger.info("🔍 Fetching default sales channel...");

  // 1. Get your default Sales Channel so the Expo app can actually see the products
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  });

  const defaultSalesChannelId = salesChannels[0]?.id;
  if (!defaultSalesChannelId) {
    logger.warn(
      "No sales channel found! Products might not appear on the frontend.",
    );
  }

  logger.info("📂 Reading mock_data.json...");
  const rawData = fs.readFileSync("mock_data.json", "utf-8");
  const shopData = JSON.parse(rawData);
  const collections = shopData.data.collections.edges;

  const productsToCreate = [];

  // 2. Format the data for the Workflow
  for (const col of collections) {
    const collectionNode = col.node;

    for (const prod of collectionNode.products.edges) {
      const pNode = prod.node;

      // Convert Shopify's decimal price (e.g. "45.0") to Medusa's cents (4500)
      const priceVal =
        parseFloat(pNode.variants.edges[0].node.price.amount) * 100;

      productsToCreate.push({
        title: pNode.title,
        description: pNode.description,
        thumbnail: pNode.featuredImage.url,
        images: [{ url: pNode.featuredImage.url }],

        // Ensure the product is attached to your store
        sales_channels: defaultSalesChannelId
          ? [{ id: defaultSalesChannelId }]
          : [],

        // Create a default option (e.g., Size)
        options: [{ title: "Size" }],

        variants: [
          {
            title: "Standard Size",
            options: { Size: "Standard" }, // Matches the option above

            // Set the default price
            prices: [
              {
                currency_code: "eur",
                amount: priceVal,
              },
              {
                currency_code: "usd",
                amount: priceVal,
              },
            ],

            // DEFAULT INVENTORY SETTING
            // Setting this to false tells Medusa to assume infinite stock.
            // This prevents your demo app from ever saying "Out of Stock".
            manage_inventory: false,
          },
        ],
      });
    }
  }

  logger.info(
    `🚀 Inserting ${productsToCreate.length} products via Workflow...`,
  );

  // 3. Execute the native v2 Workflow to safely create everything across all modules
  await createProductsWorkflow(container).run({
    input: {
      products: productsToCreate,
    },
  });

  logger.info("✅ Seeding Complete! Check your Admin Panel.");
}
