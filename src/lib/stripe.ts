import User from "../models/User";
import connectDB from "./db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function getSubscribe(email:string) {
  try {
    await connectDB();

    const user = await User.findOne({ email: email });
    // 获取用户的所有订阅
    if (!user.stripeUserId) {
      return null;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeUserId,
      status: "active",
      limit: 1,
    });

    return subscriptions.data.map((item: any) => ({
      id: item.id,
      current_period_start: item.current_period_start,
      current_period_end: item.current_period_end,
      customer: item.customer,
      plan: item.plan.id,
      plan_active: item.plan.active,
      amount: item.plan.amount,
      interval: item.plan.interval,
      quantity: item.quantity,
      canceled_at: item.cancel_at,
    }));
  } catch (error) {
    // handleError(error)
    return null;
  }
}
