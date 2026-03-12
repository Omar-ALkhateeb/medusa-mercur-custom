import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService, { Collection } from "../../modules/strapi/service";

export type DeleteCategoryFromStrapiInput = {
  id: string;
};

export const deleteCategoryFromStrapiStep = createStep(
  "delete-category-from-strapi",
  async ({ id }: DeleteCategoryFromStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    // Find the Strapi category
    const strapiCategory = await strapiService.findByMedusaId(
      Collection.CATEGORIES,
      id,
    );

    // Delete category from Strapi
    await strapiService.delete(
      Collection.CATEGORIES,
      strapiCategory.documentId,
    );

    return new StepResponse(void 0, strapiCategory);
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return;
    }

    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    // Recreate the category
    await strapiService.create(Collection.CATEGORIES, {
      medusaId: compensationData.medusaId,
      name: compensationData.name,
      handle: compensationData.handle,
      description: compensationData.description,
      locale: compensationData.locale,
    });
  },
);
