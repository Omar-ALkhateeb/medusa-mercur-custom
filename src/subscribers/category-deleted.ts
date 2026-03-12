import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework";
import { deleteCategoryFromStrapiWorkflow } from "../workflows/delete-category-from-strapi";

export default async function categoryDeletedStrapiSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await deleteCategoryFromStrapiWorkflow(container).run({
    input: { id: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "product-category.deleted",
};
