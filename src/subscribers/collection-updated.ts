import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { updateCollectionInStrapiWorkflow } from "../workflows/update-collection-in-strapi";

export default async function collectionUpdatedStrapiSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const cachingService = container.resolve(Modules.CACHING);
  const logger = container.resolve("logger");

  const cacheKey = `strapi-update:collection:${data.id}`;
  const isProcessingFromStrapi = await cachingService.get({ key: cacheKey });

  if (isProcessingFromStrapi) {
    logger.info(
      `Collection ${data.id} update originated from Strapi, skipping sync`,
    );
    return;
  }

  await updateCollectionInStrapiWorkflow(container).run({
    input: { id: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "product-collection.updated",
};
