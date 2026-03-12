import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id } = req.query;
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  try {
    const optionsResult = await remoteQuery({
      entryPoint: "shipping_option",
      // Requesting prices.* is mandatory in v2 to get the actual cost
      fields: [
        "id",
        "name",
        "price_type",
        "provider_id",
        "prices.*",
        "is_return",
      ],
    });

    const allOptions = Array.isArray(optionsResult)
      ? optionsResult
      : optionsResult.data || [];

    // Safely filter out return options and map the data for the frontend
    const mappedOptions = allOptions
      .filter((opt: any) => opt.is_return !== true)
      .map((opt: any) => ({
        id: opt.id,
        name: opt.name,
        amount: opt.prices?.[0]?.amount ?? 0,
        price_type: opt.price_type,
        provider_id: opt.provider_id,
      }));

    return res.json({ shipping_options: mappedOptions });
  } catch (error) {
    console.error("❌ Admin Shipping Route Error:", error);
    // Return empty array instead of 500 to prevent frontend crashes
    return res.json({ shipping_options: [] });
  }
};
