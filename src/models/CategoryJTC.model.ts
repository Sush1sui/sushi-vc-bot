import mongoose, { Document, Model } from "mongoose";

export interface CategoryJTCType {
  channel_id: string;
  jtc_channel_id: string;
  interface_id: string;
  interface_message_id: string;
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
  interface_id: {
    type: String,
    required: true,
    unique: true,
  },
  interface_message_id: {
    type: String,
    required: true,
    unique: true,
  },
  custom_vcs_id: { type: [String], default: [] },
});

export default mongoose.model<CategoryJTCDocument, CategoryJTCModel>(
  "CategoryJTC",
  categoryJTCSchema
);
