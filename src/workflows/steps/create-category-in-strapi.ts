import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STRAPI_MODULE } from "../../modules/strapi";
import StrapiModuleService, { Collection } from "../../modules/strapi/service";

export type CreateCategoryInStrapiInput = {
  id: string;
  name: string;
  handle: string;
  description?: string;
};

export const createCategoryInStrapiStep = createStep(
  "create-category-in-strapi",
  async (categoryData: CreateCategoryInStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    try {
      // Create category in Strapi
      const strapiCategory = await strapiService.create(Collection.CATEGORIES, {
        medusaId: categoryData.id,
        name: categoryData.name,
        handle: categoryData.handle,
        description: categoryData.description,
      });

      return new StepResponse(strapiCategory.data, strapiCategory.data);
    } catch (error) {
      return StepResponse.permanentFailure(
        strapiService.formatStrapiError(
          error,
          "Failed to create category in Strapi",
        ),
      );
    }
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return;
    }

    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

    await strapiService.delete(
      Collection.CATEGORIES,
      compensationData.documentId,
    );
  },
);
