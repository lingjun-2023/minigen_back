import mongoose from "mongoose";
import { IUser } from "./User";

const { Schema } = mongoose;

// 保存用户的token

export interface IAffiliate {
  _id: string;
  affiliate_code: string;
  clicks: number;
  signups: number;
  paid_users_number: number;
  paid_commission: number;
  paid_users_amount:number
}

const affiliateSchema = new Schema(
  {
    affiliate_code: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    signups: {
      type: Number,
      default: 0,
    },
    paid_users_number: {
      type: Number,
      default: 0,
    },
    paid_commission: {
      type: Number,
      default: 0,
    },
    paid_users_amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Affiliate ||
  mongoose.model("Affiliate", affiliateSchema);
