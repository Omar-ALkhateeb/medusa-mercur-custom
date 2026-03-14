import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createCollectionInStrapiWorkflow } from "../../../workflows/create-collection-in-strapi";
import { createCategoryInStrapiWorkflow } from "../../../workflows/create-category-in-strapi";
import { createProductInStrapiWorkflow } from "../../../workflows/create-product-in-strapi";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // In API routes, the container is accessed via req.scope
  const container = req.scope;
  const query = container.resolve("query");

  console.log("🚀 Starting full Medusa to Strapi sync via Admin API...");

  try {
    // ==========================================
    // 1. SYNC COLLECTIONS
    // ==========================================
    console.log("\n📦 Syncing Collections...");
    const { data: collections } = await query.graph({
      entity: "product_collection",
      fields: ["id", "title", "metadata"],
    });

    for (const collection of collections) {
      if (collection.metadata?.strapi_id) {
        console.log(
          `⏭️  Skipping Collection: ${collection.title} (Already in Strapi)`,
        );
        continue;
      }
      try {
        await createCollectionInStrapiWorkflow(container).run({
          input: { id: collection.id },
        });
        console.log(`✅ Synced Collection: ${collection.title}`);
      } catch (error: any) {
        console.error(
          `❌ Failed Collection ${collection.title}:`,
          error.message,
        );
      }
    }

    // ==========================================
    // 2. SYNC CATEGORIES
    // ==========================================
    console.log("\n🗂️  Syncing Categories...");
    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["id", "name", "metadata"],
    });

    for (const category of categories) {
      if (category.metadata?.strapi_id) {
        console.log(
          `⏭️  Skipping Category: ${category.name} (Already in Strapi)`,
        );
        continue;
      }
      try {
        await createCategoryInStrapiWorkflow(container).run({
          input: { id: category.id },
        });
        console.log(`✅ Synced Category: ${category.name}`);
      } catch (error: any) {
        console.error(`❌ Failed Category ${category.name}:`, error.message);
      }
    }

    // ==========================================
    // 3. SYNC PRODUCTS
    // ==========================================
    console.log("\n🛍️  Syncing Products...");
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "metadata"],
    });

    for (const product of products) {
      if (product.metadata?.strapi_id) {
        console.log(
          `⏭️  Skipping Product: ${product.title} (Already in Strapi)`,
        );
        continue;
      }
      try {
        await createProductInStrapiWorkflow(container).run({
          input: { id: product.id },
        });
        console.log(`✅ Synced Product: ${product.title}`);
      } catch (error: any) {
        console.error(`❌ Failed Product ${product.title}:`, error.message);
      }
    }

    console.log("\n🎉 Full sync complete!");
    res.status(200).json({
      success: true,
      message: "Sync complete! Check server logs for details.",
    });
  } catch (error: any) {
    console.error("❌ Sync failed with a critical error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
