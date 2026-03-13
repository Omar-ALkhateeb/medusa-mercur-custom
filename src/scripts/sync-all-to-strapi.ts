import { ExecArgs } from "@medusajs/framework/types";
import { createCollectionInStrapiWorkflow } from "../workflows/create-collection-in-strapi";
import { createCategoryInStrapiWorkflow } from "../workflows/create-category-in-strapi";
import { createProductInStrapiWorkflow } from "../workflows/create-product-in-strapi";
// Optional: Import your update workflows if you want to update existing items instead of just skipping them
import { updateCollectionInStrapiWorkflow } from "../workflows/update-collection-in-strapi";
import { updateCategoryInStrapiWorkflow } from "../workflows/update-category-in-strapi";

export default async function syncAllToStrapi({ container }: ExecArgs) {
  const query = container.resolve("query");

  console.log("🚀 Starting full Medusa to Strapi sync...");

  // ==========================================
  // 1. SYNC COLLECTIONS
  // ==========================================
  console.log("\n📦 Syncing Collections...");
  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "title", "metadata"],
  });

  for (const collection of collections) {
    // Prevent duplication: Check if it already has a Strapi ID
    if (collection.metadata?.strapi_id) {
      console.log(
        `⏭️  Skipping Collection: ${collection.title} (Already in Strapi)`,
      );
      // NOTE: If you want to force an update instead of skipping, uncomment the next line:
      // await updateCollectionInStrapiWorkflow(container).run({ input: { id: collection.id } })
      continue;
    }

    try {
      await createCollectionInStrapiWorkflow(container).run({
        input: { id: collection.id },
      });
      console.log(`✅ Synced Collection: ${collection.title}`);
    } catch (error: any) {
      console.error(`❌ Failed Collection ${collection.title}:`, error.message);
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
      // await updateCategoryInStrapiWorkflow(container).run({ input: { id: category.id } })
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
  // 3. SYNC PRODUCTS (and their variants/images)
  // ==========================================
  console.log("\n🛍️  Syncing Products...");
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
  });

  for (const product of products) {
    if (product.metadata?.strapi_id) {
      console.log(`⏭️  Skipping Product: ${product.title} (Already in Strapi)`);
      // Assuming you have an updateProductInStrapiWorkflow, you could call it here
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
}
