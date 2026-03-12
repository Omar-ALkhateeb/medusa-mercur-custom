import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { updateCategoryInStrapiStep } from "./steps/update-category-in-strapi";

export type UpdateCategoryInStrapiWorkflowInput = { id: string };

export const updateCategoryInStrapiWorkflow = createWorkflow(
  "update-category-in-strapi",
  (input: UpdateCategoryInStrapiWorkflowInput) => {
    // Fetch the updated category from Medusa
    const { data: categories } = useQueryGraphStep({
      entity: "product_category",
      fields: ["id", "name", "handle", "description"],
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

    // Update in Strapi
    const updatedStrapiCategory = updateCategoryInStrapiStep(preparedCategory);

    return new WorkflowResponse({ strapi_category: updatedStrapiCategory });
  },
);
