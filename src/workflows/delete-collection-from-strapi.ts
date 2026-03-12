import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteCollectionFromStrapiStep } from "./steps/delete-collection-from-strapi";

export type DeleteCollectionFromStrapiWorkflowInput = { id: string };

export const deleteCollectionFromStrapiWorkflow = createWorkflow(
  "delete-collection-from-strapi",
  (input: DeleteCollectionFromStrapiWorkflowInput) => {
    deleteCollectionFromStrapiStep(input);
    return new WorkflowResponse(void 0);
  },
);
