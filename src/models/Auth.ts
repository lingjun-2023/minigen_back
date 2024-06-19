import mongoose from "mongoose";

const { Schema } = mongoose;

// 保存用户的token

export interface IAuth {
  _id: string,
  email: string,
  category: 'tiktok' | 'instagram' | 'youtube',
  tokens:any
}

const authSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['tiktok', 'instagram', 'youtube']
    },
    email: {
      type: String,
      required: true,
    },
    tokens: {
      type: Schema.Types.Mixed,
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.models.Auth || mongoose.model("Auth", authSchema);