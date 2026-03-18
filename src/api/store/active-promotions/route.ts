import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Resolve Medusa's graph query engine
  const query = req.scope.resolve("query");

  try {
    // Fetch all active, automatic promotions and their application rules
    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: [
        "id",
        "name",
        "is_automatic",
        // Grab the reward details (e.g., 10 fixed, or 15 percent)
        "application_method.value",
        "application_method.type",
        // Grab the conditions to unlock it
        "rules.attribute",
        "rules.operator",
        "rules.values"
      ],
      filters: {
        // SECURITY: We strictly only return automatic promotions. 
        // We do NOT want to leak manual promo codes (like "SUMMER20") to the public API.
        is_automatic: true,
      }
    });

    // Return the safe list to your Expo app
    return res.json({ promotions });
    
  } catch (error: any) {
    console.error("Error fetching active promotions:", error);
    return res.status(500).json({ error: error.message });
  }
};