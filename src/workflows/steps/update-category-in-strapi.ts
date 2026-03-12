import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService, { Collection } from "../../modules/strapi/service";

export type UpdateCategoryInStrapiInput = {
  id: string;
  name?: string;
  handle?: string;
  description?: string;
};

export const updateCategoryInStrapiStep = createStep(
  "update-category-in-strapi",
  async (category: UpdateCategoryInStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    // Find the Strapi category
    const originalData = await strapiService.findByMedusaId(
      Collection.CATEGORIES,
      category.id,
    );

    // Update category in Strapi
    const updated = await strapiService.update(
      Collection.CATEGORIES,
      originalData.documentId,
      {
        name: category.name,
        handle: category.handle,
        description: category.description,
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
      Collection.CATEGORIES,
      compensationData.documentId,
      {
        name: compensationData.name,
        handle: compensationData.handle,
        description: compensationData.description,
      },
    );
  },
);
