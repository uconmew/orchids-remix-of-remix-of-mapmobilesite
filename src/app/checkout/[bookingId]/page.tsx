"use client";

import { useState, useEffect, use } from "react";
import { getStripe } from "@/lib/stripe-client";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Shield, Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const stripePromise = getStripe();


interface CheckoutFormProps {
  clientSecret: string;
  bookingId: string;
  amount: number;
  serviceName: string;
  agreedToTOS: boolean;
  setAgreedToTOS: (agreed: boolean) => void;
}

function CheckoutForm({ clientSecret, bookingId, amount, serviceName, agreedToTOS, setAgreedToTOS }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);

  const getErrorMessage = (err: { type: string; code?: string; decline_code?: string; message?: string }) => {
    if (err.type === 'card_error' || err.type === 'validation_error') {
      if (err.decline_code === 'insufficient_funds') {
        return 'Your payment method has insufficient funds. Please try a different payment method.';
      }
      if (err.decline_code === 'generic_decline' || err.code === 'payment_intent_authentication_failure') {
        return 'Your payment was declined. This may happen if the payment was not authorized in your app (e.g., Cash App). Please check your payment app and try again.';
      }
      if (err.code === 'payment_method_not_available') {
        return 'This payment method is not available. Please try a different payment method.';
      }
      return err.message || 'Your payment was declined. Please try a different payment method.';
    }
    return err.message || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !agreedToTOS || !elementsReady) return;

    setProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (submitError) {
      const errorMessage = getErrorMessage(submitError as { type: string; code?: string; decline_code?: string; message?: string });
      setError(errorMessage);
      setProcessing(false);
      return;
    }

    if (paymentIntent) {
      if (paymentIntent.status === "succeeded") {
        const res = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id, bookingId }),
        });

        if (res.ok) {
          setSuccess(true);
        } else {
          setError("Payment succeeded but failed to update booking. Please contact support.");
        }
      } else if (paymentIntent.status === "requires_action") {
        setError("Additional verification required. Please complete authentication in your payment app (e.g., Cash App) and try again.");
      } else if (paymentIntent.status === "requires_payment_method") {
        setError("Payment failed. Please try a different payment method.");
      } else {
        setError(`Payment status: ${paymentIntent.status}. Please try again or contact support.`);
      }
    }

    setProcessing(false);
  };

  if (success) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Payment Successful!</h2>
          <p className="text-foreground/60 mt-2">
            Your {serviceName} appointment has been confirmed.
          </p>
        </div>
        <p className="text-3xl font-black text-primary italic">${amount}</p>
        <Button asChild className="blue-gradient text-white border-none h-12 px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
          <Link href="/dashboard">View My Installatons</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="font-black uppercase tracking-tight text-lg">{serviceName}</h3>
            <p className="text-sm text-foreground/60">Mobile Audio Installation</p>
          </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary italic">${amount}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wider">
              <span className="text-amber-400 mr-2">Local Service:</span> 
              Installation performed at your location. In-stock items included. Special orders may vary.
            </p>
          </div>
        </div>

      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-h-[400px] overflow-y-auto">
        <PaymentElement
          onReady={() => setElementsReady(true)}
          options={{
            layout: "tabs",
          }}
        />
      </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="tos"
              checked={agreedToTOS}
              onChange={(e) => setAgreedToTOS(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
            />
            <label htmlFor="tos" className="text-[10px] font-black uppercase tracking-widest text-foreground/60 cursor-pointer">
              I have read and agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </label>
          </div>
        </div>

        {!agreedToTOS && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Shield className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Please read and accept the Terms of Service to proceed with payment.</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!stripe || !elements || processing || !agreedToTOS || !elementsReady}
          className="w-full h-14 blue-gradient text-white border-none text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20"
        >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : !elementsReady ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay ${amount}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-foreground/40">
        <Shield className="h-4 w-4" />
        <span>Secured by Stripe. Your payment info is never stored.</span>
      </div>
    </form>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [serviceName, setServiceName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTOS, setAgreedToTOS] = useState(false);

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Failed to initialize payment");
          setLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setServiceName(data.serviceName || "Car Detailing");
        setLoading(false);
      } catch {
        setError("Failed to connect to payment server");
        setLoading(false);
      }
    }

    createPaymentIntent();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
          <p className="text-foreground/60">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full bg-white/5 border-white/10">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Payment Error</h2>
            <p className="text-foreground/60">{error}</p>
            <Button asChild variant="outline" className="border-white/10">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-full blue-gradient flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Complete Payment</CardTitle>
              <p className="text-foreground/60 text-sm mt-1">Secure checkout for your mobile installation</p>
            </CardHeader>
            <CardContent>
              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "night",
                      variables: {
                        colorPrimary: "#0066FF",
                        colorBackground: "#1a1a1a",
                        colorText: "#ffffff",
                        colorDanger: "#ef4444",
                        fontFamily: "system-ui, sans-serif",
                        borderRadius: "12px",
                      },
                      rules: {
                        ".Input": {
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        },
                        ".Input:focus": {
                          border: "1px solid #0066FF",
                          boxShadow: "0 0 0 1px #0066FF",
                        },
                        ".Tab": {
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        },
                        ".Tab--selected": {
                          backgroundColor: "#0066FF",
                          border: "1px solid #0066FF",
                        },
                      },
                    },
                  }}
                >

                <CheckoutForm
                  clientSecret={clientSecret}
                  bookingId={bookingId}
                  amount={amount}
                  serviceName={serviceName}
                  agreedToTOS={agreedToTOS}
                  setAgreedToTOS={setAgreedToTOS}
                />
              </Elements>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
      );
    }

