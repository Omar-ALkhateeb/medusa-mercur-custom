import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService, { Collection } from "../../modules/strapi/service";

export type CreateCollectionInStrapiInput = {
  id: string;
  title: string;
  handle: string;
};

export const createCollectionInStrapiStep = createStep(
  "create-collection-in-strapi",
  async (collectionData: CreateCollectionInStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    try {
      // Create collection in Strapi
      const strapiCollection = await strapiService.create(
        Collection.COLLECTIONS,
        {
          medusaId: collectionData.id,
          title: collectionData.title,
          handle: collectionData.handle,
        },
      );

      return new StepResponse(strapiCollection.data, strapiCollection.data);
    } catch (error) {
      return StepResponse.permanentFailure(
        strapiService.formatStrapiError(
          error,
          "Failed to create collection in Strapi",
        ),
      );
    }
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return;
    }

    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    // Delete the created collection if the workflow fails later
    await strapiService.delete(
      Collection.COLLECTIONS,
      compensationData.documentId,
    );
  },
);
