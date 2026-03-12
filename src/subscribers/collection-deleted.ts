import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework";
import { deleteCollectionFromStrapiWorkflow } from "../workflows/delete-collection-from-strapi";

export default async function collectionDeletedStrapiSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await deleteCollectionFromStrapiWorkflow(container).run({
    input: { id: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "product-collection.deleted",
};
