import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework";
import { createCategoryInStrapiWorkflow } from "../workflows/create-category-in-strapi";

export default async function categoryCreatedStrapiSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await createCategoryInStrapiWorkflow(container).run({
    input: { id: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "product-category.created",
};
