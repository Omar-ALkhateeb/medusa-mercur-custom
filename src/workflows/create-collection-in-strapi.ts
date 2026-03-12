import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { createCollectionInStrapiStep } from "./steps/create-collection-in-strapi";
import { updateCollectionInStrapiStep } from "./steps/update-collection-in-strapi";

export type CreateCollectionInStrapiWorkflowInput = { id: string };

export const createCollectionInStrapiWorkflow = createWorkflow(
  "create-collection-in-strapi",
  (input: CreateCollectionInStrapiWorkflowInput) => {
    const { data: collections } = useQueryGraphStep({
      entity: "product_collection",
      fields: ["id", "title", "handle", "metadata"],
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

    const strapiCollection = createCollectionInStrapiStep(preparedCollection);

    const metadataUpdate = transform({ strapiCollection }, (data) => {
      return {
        id: data.strapiCollection.medusaId,
        strapiId: data.strapiCollection.id,
        strapiDocumentId: data.strapiCollection.documentId,
      };
    });

    updateCollectionInStrapiStep(metadataUpdate);

    return new WorkflowResponse({ strapi_collection: strapiCollection });
  },
);
