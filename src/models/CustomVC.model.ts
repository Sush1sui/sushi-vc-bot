import { channel } from "diagnostics_channel";
import mongoose, { Document, Model } from "mongoose";

export interface CustomVCType {
  channel_id: string;
  owner_id: string;
}

export interface CustomVCDocument extends CustomVCType, Document {}
export interface CustomVCModel extends Model<CustomVCDocument> {}

const customVCSchema = new mongoose.Schema({
  channel_id: {
    type: String,
    required: true,
    unique: true,
  },
  owner_id: {
    type: String,
    required: true,
  },
});

export default mongoose.model<CustomVCDocument, CustomVCModel>(
  "CustomVC",
  customVCSchema
);
