import { Schema, model, models } from "mongoose";

export interface IBillingPlan{
  _id: string,
  createdAt: Date,
  stripeId: string,
  amount: number,
  plan: string,
  buyerId: string,
  seriesNum: string
}

const billingPlanSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  stripeId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  plan: {
    type: String,
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  seriesNum:{
    type: String,
    required: true,
  }
});

const BillingPlan = models?.BillingPlan || model("BillingPlan", billingPlanSchema);

export default BillingPlan;