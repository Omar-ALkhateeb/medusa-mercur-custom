import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { updateCollectionInStrapiStep } from "./steps/update-collection-in-strapi";

export type UpdateCollectionInStrapiWorkflowInput = { id: string };

export const updateCollectionInStrapiWorkflow = createWorkflow(
  "update-collection-in-strapi",
  (input: UpdateCollectionInStrapiWorkflowInput) => {
    // Fetch the updated collection from Medusa
    const { data: collections } = useQueryGraphStep({
      entity: "product_collection",
      fields: ["id", "title", "handle"],
      filters: { id: [input.id] },
      options: { throwIfKeyNotFound: true },
    });

    const preparedCollection = transform({ collections }, (data) => {
      const col = data.collections[0];
      return {
        id: col.id,
        title: col.title,
        handle: col.handle,
      };
    });

    // Update in Strapi
    const updatedStrapiCollection =
      updateCollectionInStrapiStep(preparedCollection);

    return new WorkflowResponse({ strapi_collection: updatedStrapiCollection });
  },
);
