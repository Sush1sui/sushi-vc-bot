import mongoose, { Document, Model, mongo } from "mongoose";

export interface CategoryJTCType {
  channel_id: string;
  jtc_channel_id: string;
  custom_vcs_id: string[];
}

export interface CategoryJTCDocument extends CategoryJTCType, Document {}
export interface CategoryJTCModel extends Model<CategoryJTCDocument> {}

const categoryJTCSchema = new mongoose.Schema({
  channel_id: {
    type: String,
    required: true,
    unique: true,
  },
  jtc_channel_id: {
    type: String,
    required: true,
    unique: true,
  },
  custom_vcs_id: [
    {
      type: String,
      required: true,
      unique: true,
    },
  ],
});

export default mongoose.model<CategoryJTCDocument, CategoryJTCModel>(
  "CategoryJTC",
  categoryJTCSchema
);
