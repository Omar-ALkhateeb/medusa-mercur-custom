import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { updateCategoryInStrapiWorkflow } from "../workflows/update-category-in-strapi";

export default async function categoryUpdatedStrapiSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const cachingService = container.resolve(Modules.CACHING);
  const logger = container.resolve("logger");

  const cacheKey = `strapi-update:category:${data.id}`;
  const isProcessingFromStrapi = await cachingService.get({ key: cacheKey });

  if (isProcessingFromStrapi) {
    logger.info(
      `Category ${data.id} update originated from Strapi, skipping sync`,
    );
    return;
  }

  await updateCategoryInStrapiWorkflow(container).run({
    input: { id: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "product-category.updated",
};
