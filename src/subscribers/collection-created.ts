import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework";
import { createCollectionInStrapiWorkflow } from "../workflows/create-collection-in-strapi";

export default async function collectionCreatedStrapiSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await createCollectionInStrapiWorkflow(container).run({
    input: { id: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "product-collection.created",
};
