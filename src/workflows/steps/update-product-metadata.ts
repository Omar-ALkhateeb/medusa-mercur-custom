import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

export type UpdateProductMetadataInput = {
  id: string;
  strapi_id: number;
  strapi_document_id: string;
};

export const updateProductMetadataStep = createStep(
  "update-product-metadata",
  async (input: UpdateProductMetadataInput, { container }) => {
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Fetch original for compensation logic
    const [product] = await productModuleService.listProducts({
      id: [input.id],
    });

    // Correct signature: updateProducts(id, data)
    const updated = await productModuleService.updateProducts(input.id, {
      metadata: {
        ...product.metadata,
        strapi_id: input.strapi_id,
        strapi_document_id: input.strapi_document_id,
      },
    });

    return new StepResponse(updated, product);
  },
  async (original, { container }) => {
    if (!original) return;
    const productModuleService = container.resolve(Modules.PRODUCT);

    // Correct signature for rollback
    await productModuleService.updateProducts(original.id, {
      metadata: original.metadata,
    });
  },
);
