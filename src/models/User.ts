import mongoose from "mongoose";
import { IAffiliate } from "./Affiliate";


const { Schema } = mongoose;

export interface IUser {
  _id: string;
  email: string;
  password?: string;
  isVerified: boolean;
  stripeUserId?: string;
  affiliate: IAffiliate;
  paypalEmail?: string;
  referredBy?:string
}

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
      require: false,
    },
    stripeUserId: {
      type: String,
      required: false,
    },
    affiliate: {
      type: Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
    },
    paypalEmail: {
      type: String,
      required: false,
    },
    referredBy: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
