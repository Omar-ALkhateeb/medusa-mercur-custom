import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createCategoryInStrapiStep } from "./steps/create-category-in-strapi";
import { updateCategoryInStrapiStep } from "./steps/update-category-in-strapi";

export type CreateCategoryInStrapiWorkflowInput = { id: string };

export const createCategoryInStrapiWorkflow = createWorkflow(
  "create-category-in-strapi",
  (input: CreateCategoryInStrapiWorkflowInput) => {
    const { data: categories } = useQueryGraphStep({
      entity: "product_category",
      fields: ["id", "name", "handle", "description", "metadata"],
      filters: { id: [input.id] },
      options: { throwIfKeyNotFound: true },
    });

    const preparedCategory = transform({ categories }, (data) => {
      const cat = data.categories[0];
      return {
        id: cat.id,
        name: cat.name,
        handle: cat.handle,
        description: cat.description,
      };
    });

    const strapiCategory = createCategoryInStrapiStep(preparedCategory);

    const metadataUpdate = transform({ strapiCategory }, (data) => {
      return {
        id: data.strapiCategory.medusaId,
        strapiId: data.strapiCategory.id,
        strapiDocumentId: data.strapiCategory.documentId,
      };
    });

    updateCategoryInStrapiStep(metadataUpdate);

    return new WorkflowResponse({ strapi_category: strapiCategory });
  },
);
