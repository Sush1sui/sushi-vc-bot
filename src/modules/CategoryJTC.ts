import CategoryJTC from "../models/CategoryJTC.model";

export async function initializeCategoryJTC(
  interface_id: string,
  jtc_channel_id: string,
  category_id: string
) {
  try {
    // Use findOne instead of find to reduce unnecessary data fetching
    const existingCategory = await CategoryJTC.findOne({
      channel_id: category_id, // Ensure the field name matches the schema
    });

    if (existingCategory) {
      throw new Error(
        "There is already an initialized VC interface in this category"
      );
    }

    const initializedCategory = await CategoryJTC.create({
      channel_id: category_id,
      interface_id,
      jtc_channel_id,
      custom_vcs_id: [],
    });

    return initializedCategory;
  } catch (error) {
    console.error(`Error initializing category: ${(error as Error).message}`);
    return null;
  }
}
