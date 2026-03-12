import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteCategoryFromStrapiStep } from "./steps/delete-category-from-strapi";

export type DeleteCategoryFromStrapiWorkflowInput = { id: string };

export const deleteCategoryFromStrapiWorkflow = createWorkflow(
  "delete-category-from-strapi",
  (input: DeleteCategoryFromStrapiWorkflowInput) => {
    deleteCategoryFromStrapiStep(input);
    return new WorkflowResponse(void 0);
  },
);
