import { MedusaContainer } from "@medusajs/framework/types";
import { createCollectionInStrapiWorkflow } from "../workflows/create-collection-in-strapi";
import { createCategoryInStrapiWorkflow } from "../workflows/create-category-in-strapi";
import { createProductInStrapiWorkflow } from "../workflows/create-product-in-strapi";

// Jobs in Medusa v2 receive the container directly
export default async function syncAllToStrapiJob(container: MedusaContainer) {
  const query = container.resolve("query");

  console.log("⏰ Running Scheduled Job: Medusa to Strapi Sync...");

  // ==========================================
  // 1. SYNC COLLECTIONS
  // ==========================================
  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "title", "metadata"],
  });

  for (const collection of collections) {
    if (!collection.metadata?.strapi_id) {
      try {
        await createCollectionInStrapiWorkflow(container).run({
          input: { id: collection.id },
        });
        console.log(`✅ Synced Collection: ${collection.title}`);
      } catch (e: any) {
        console.error(`❌ Failed Collection ${collection.title}:`, e.message);
      }
    }
  }

  // ==========================================
  // 2. SYNC CATEGORIES
  // ==========================================
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "metadata"],
  });

  for (const category of categories) {
    if (!category.metadata?.strapi_id) {
      try {
        await createCategoryInStrapiWorkflow(container).run({
          input: { id: category.id },
        });
        console.log(`✅ Synced Category: ${category.name}`);
      } catch (e: any) {
        console.error(`❌ Failed Category ${category.name}:`, e.message);
      }
    }
  }

  // ==========================================
  // 3. SYNC PRODUCTS
  // ==========================================
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
  });

  for (const product of products) {
    if (!product.metadata?.strapi_id) {
      try {
        await createProductInStrapiWorkflow(container).run({
          input: { id: product.id },
        });
        console.log(`✅ Synced Product: ${product.title}`);
      } catch (e: any) {
        console.error(`❌ Failed Product ${product.title}:`, e.message);
      }
    }
  }
}

// Configuration for the job schedule
export const config = {
  name: "daily-strapi-sync",
  // Standard cron syntax. "0 2 * * *" means "Run every day at 2:00 AM"
  // You can change this to "*/5 * * * *" to run every 5 minutes while testing
  schedule: "0 2 * * *",
};
