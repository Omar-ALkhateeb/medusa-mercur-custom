import { ExecArgs } from "@medusajs/framework/types";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";

export default async function seedMockData({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const query = container.resolve("query");

  logger.info("🔍 Fetching default sales channel...");

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

  const productsToCreate: any[] = [];

  for (const col of collections) {
    const collectionNode = col.node;

    for (const prod of collectionNode.products.edges) {
      const pNode = prod.node;

      const priceVal =
        parseFloat(pNode.variants.edges[0].node.price.amount) * 100;

      // FIX: Generate a guaranteed unique URL handle so Medusa doesn't crash on duplicates
      const safeSlug = pNode.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const randomString = Math.random().toString(36).substring(2, 7);
      const uniqueHandle = `${safeSlug}-${randomString}`;

      productsToCreate.push({
        title: pNode.title,
        handle: uniqueHandle, // Injecting the unique handle here
        description: pNode.description,
        thumbnail: pNode.featuredImage.url,
        images: [{ url: pNode.featuredImage.url }],

        sales_channels: defaultSalesChannelId
          ? [{ id: defaultSalesChannelId }]
          : [],

        options: [{ title: "Size" }],

        variants: [
          {
            title: "Standard Size",
            options: { Size: "Standard" },
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
            manage_inventory: false,
          },
        ],
      });
    }
  }

  logger.info(
    `🚀 Inserting ${productsToCreate.length} products via Workflow...`,
  );

  await createProductsWorkflow(container).run({
    input: {
      products: productsToCreate,
    },
  });

  logger.info("✅ Seeding Complete! Check your Admin Panel.");
}
