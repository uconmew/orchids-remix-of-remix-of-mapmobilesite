import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      stripePromise = loadStripe(key);
    } else {
      console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined. Stripe will not be initialized.");
      return Promise.resolve(null);
    }
  }
  return stripePromise;
};
