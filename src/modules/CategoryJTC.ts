import CategoryJTC from "../models/CategoryJTC.model";
import CustomVC from "../models/CustomVC.model";

export async function getAllCategoryJTCs() {
  try {
    const CategoryJTCs = await CategoryJTC.find();
    return CategoryJTCs;
  } catch (error) {
    console.log(error);
    return [];
  }
}

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

export async function deleteInitializedCategoryJTC(channel_id: string) {
  try {
    const deletedCategoryJTC = await CategoryJTC.findOneAndDelete({
      channel_id,
    });
    return deletedCategoryJTC;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function addCustomVC(
  category_id: string,
  custom_vc_id: string,
  owner_id: string
) {
  try {
    const updatedCategory = await CategoryJTC.findOneAndUpdate(
      { channel_id: category_id },
      { $addToSet: { custom_vcs_id: custom_vc_id } },
      { new: true }
    );

    const newCustomVC = await CustomVC.create({
      channel_id: custom_vc_id,
      owner_id,
    });

    if (!updatedCategory) {
      console.warn(`Category with ID ${category_id} not found`);
      return null;
    }

    console.log(updatedCategory);
    return { newCustomVC, updatedCategory };
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function removeCustomVC(
  category_id: string,
  custom_vc_id: string
) {
  try {
    const updatedCategory = await CategoryJTC.findOneAndUpdate(
      { channel_id: category_id },
      { $pull: { custom_vcs_id: custom_vc_id } },
      { new: true }
    );

    const deletedCustomVC = await CustomVC.findOneAndDelete({
      channel_id: custom_vc_id,
    });

    return {
      deletedCustomVC,
      updatedCategory,
    };
  } catch (error) {
    console.error(`Error removing custom VC: ${(error as Error).message}`);
    return null;
  }
}

export async function changeOwnerCustomVC(
  channel_id: string,
  newOwnerId: string
) {
  try {
    const updatedCustomVC = await CustomVC.findOneAndUpdate(
      { channel_id },
      { $set: { owner_id: newOwnerId } },
      { new: true }
    );

    return updatedCustomVC;
  } catch (error) {
    console.log(error);
    return null;
  }
}
