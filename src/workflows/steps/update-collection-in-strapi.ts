import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService, { Collection } from "../../modules/strapi/service";

export type UpdateCollectionInStrapiInput = {
  id: string;
  title?: string;
  handle?: string;
};

export const updateCollectionInStrapiStep = createStep(
  "update-collection-in-strapi",
  async (collection: UpdateCollectionInStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    // Find the Strapi collection
    const originalData = await strapiService.findByMedusaId(
      Collection.COLLECTIONS,
      collection.id,
    );

    // Update collection in Strapi
    const updated = await strapiService.update(
      Collection.COLLECTIONS,
      originalData.documentId,
      {
        title: collection.title,
        handle: collection.handle,
      },
    );

    return new StepResponse(updated.data, originalData);
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return;
    }

    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    // Revert back to original data
    await strapiService.update(
      Collection.COLLECTIONS,
      compensationData.documentId,
      {
        title: compensationData.title,
        handle: compensationData.handle,
      },
    );
  },
);
