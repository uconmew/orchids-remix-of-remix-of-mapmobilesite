"use client";

import React, { useState, useEffect, use } from "react";
import { getStripe } from "@/lib/stripe-client";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Shield, CheckCircle2, XCircle, ArrowLeft, DollarSign, SplitSquareVertical, Plus } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const stripePromise = getStripe();


interface PaymentInfo {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  serviceName: string;
  paymentStatus: string;
  paymentMethod: string | null;
}

interface CompletedPayment {
  amount: number;
  paymentNumber: number;
}

interface SplitPaymentFormProps {
  clientSecret: string;
  bookingId: string;
  amount: number;
  paymentNumber: number;
  remainingAfterThis: number;
  onSuccess: (amount: number) => void;
  onError: (message: string) => void;
}

function SplitPaymentForm({ clientSecret, bookingId, amount, paymentNumber, remainingAfterThis, onSuccess, onError }: SplitPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = authClient.useSession();
  const [processing, setProcessing] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !elementsReady) return;

    setProcessing(true);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (submitError) {
      onError(submitError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      const res = await fetch("/api/split-payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          paymentIntentId: paymentIntent.id, 
          bookingId,
          performedBy: session?.user?.id,
        }),
      });

      if (res.ok) {
        onSuccess(amount);
      } else {
        onError("Payment succeeded but failed to update booking. Please contact support.");
      }
    } else {
      onError(`Payment status: ${paymentIntent?.status}. Please try again.`);
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold uppercase tracking-wider text-primary">Payment #{paymentNumber}</span>
          <span className="text-2xl font-black text-primary italic">${amount.toFixed(2)}</span>
        </div>
        {remainingAfterThis > 0 && (
          <p className="text-xs text-foreground/60 mt-2">
            ${remainingAfterThis.toFixed(2)} will remain after this payment
          </p>
        )}
      </div>

      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-h-[400px] overflow-y-auto">
        <PaymentElement
          onReady={() => setElementsReady(true)}
          options={{ layout: "tabs" }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || !elements || !elementsReady || processing}
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
            Loading...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-foreground/40">
        <Shield className="h-4 w-4" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
}

export default function SplitPaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [splitAmounts, setSplitAmounts] = useState<number[]>([0]);
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [completedPayments, setCompletedPayments] = useState<CompletedPayment[]>([]);
    const [creatingIntent, setCreatingIntent] = useState(false);
    const [allComplete, setAllComplete] = useState(false);
    const [agreedToTOS, setAgreedToTOS] = useState(false);

    useEffect(() => {
    async function fetchPaymentInfo() {
      try {
        const res = await fetch(`/api/split-payment?bookingId=${bookingId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load payment info");
          setLoading(false);
          return;
        }

        if (data.booking.paymentMethod === 'pay_on_arrival' || data.booking.paymentMethod === 'arrival') {
          setError("This booking is set to Pay on Arrival. Card payments cannot be mixed with Pay on Arrival.");
          setLoading(false);
          return;
        }

        if (data.booking.paymentStatus === 'paid') {
          setError("This booking is already fully paid.");
          setLoading(false);
          return;
        }

          setPaymentInfo(data.booking);
          setSplitAmounts([data.booking.remainingAmount]);
          setLoading(false);
        } catch {
          setError("Failed to connect to server");
          setLoading(false);
        }
      }

      fetchPaymentInfo();
    }, [bookingId]);

  const addSplitPayment = () => {
    if (!paymentInfo) return;
    const currentTotal = splitAmounts.reduce((a, b) => a + b, 0);
    if (currentTotal < paymentInfo.remainingAmount) {
      setSplitAmounts([...splitAmounts, 0]);
    }
  };

  const removeSplitPayment = (index: number) => {
    if (splitAmounts.length <= 1) return;
    const newAmounts = splitAmounts.filter((_, i) => i !== index);
    setSplitAmounts(newAmounts);
  };

  const updateSplitAmount = (index: number, value: number) => {
    if (!paymentInfo) return;
    const newAmounts = [...splitAmounts];
    newAmounts[index] = Math.max(0, value);
    
    const otherTotal = newAmounts.reduce((sum, amt, i) => i !== index ? sum + amt : sum, 0);
    const maxForThis = paymentInfo.remainingAmount - otherTotal;
    newAmounts[index] = Math.min(newAmounts[index], maxForThis);
    
    setSplitAmounts(newAmounts);
  };

  const distributeSplitEvenly = () => {
    if (!paymentInfo || splitAmounts.length === 0) return;
    const perPayment = Math.floor((paymentInfo.remainingAmount / splitAmounts.length) * 100) / 100;
    const remainder = paymentInfo.remainingAmount - (perPayment * splitAmounts.length);
    const newAmounts = splitAmounts.map((_, i) => 
      i === 0 ? Math.round((perPayment + remainder) * 100) / 100 : perPayment
    );
    setSplitAmounts(newAmounts);
  };

  const startPayments = async () => {
    const totalSplit = splitAmounts.reduce((a, b) => a + b, 0);
    if (!paymentInfo || Math.abs(totalSplit - paymentInfo.remainingAmount) > 0.01) {
      setError(`Split amounts must equal $${paymentInfo?.remainingAmount.toFixed(2)}`);
      return;
    }

    const validAmounts = splitAmounts.filter(a => a >= 0.50);
    if (validAmounts.length !== splitAmounts.length) {
      setError("Each payment must be at least $0.50");
      return;
    }

    await createPaymentIntent(0);
  };

  const createPaymentIntent = async (paymentIndex: number) => {
    setCreatingIntent(true);
    setError(null);

    try {
      const res = await fetch("/api/split-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount: splitAmounts[paymentIndex],
          paymentNumber: paymentIndex + 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create payment");
        setCreatingIntent(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setCurrentPaymentIndex(paymentIndex);
      setCreatingIntent(false);
    } catch {
      setError("Failed to connect to server");
      setCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = async (amount: number) => {
    const newCompleted = [...completedPayments, { amount, paymentNumber: currentPaymentIndex + 1 }];
    setCompletedPayments(newCompleted);
    setClientSecret(null);

    // Calculate total paid including this payment
    const totalPaidSoFar = newCompleted.reduce((a, b) => a + b.amount, 0) + (paymentInfo?.paidAmount || 0);
    const totalRequired = paymentInfo?.totalAmount || 0;
    const isNowFullyPaid = (totalRequired - totalPaidSoFar) < 0.01;

    if (currentPaymentIndex + 1 < splitAmounts.length) {
      // More payments to process
      await createPaymentIntent(currentPaymentIndex + 1);
    } else if (isNowFullyPaid) {
      // All split payments done AND fully paid
      setAllComplete(true);
    } else {
      // All split payments done but NOT fully paid - show partial status
      setAllComplete(false);
      // Refresh payment info to show updated remaining balance
      const res = await fetch(`/api/split-payment?bookingId=${bookingId}`);
      const data = await res.json();
      if (res.ok) {
        setPaymentInfo(data.booking);
      }
    }
  };

  const handlePaymentError = (message: string) => {
    setError(message);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
          <p className="text-foreground/60">Loading payment info...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
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

  // Show partial payment status when split payments are done but booking is not fully paid
  const totalPaidThisSession = completedPayments.reduce((a, b) => a + b.amount, 0);
  const totalPaidOverall = totalPaidThisSession + (paymentInfo?.paidAmount || 0);
  const hasRemainingBalance = paymentInfo && (paymentInfo.totalAmount - totalPaidOverall) > 0.01;
  const sessionPaymentsDone = completedPayments.length > 0 && completedPayments.length === splitAmounts.filter(a => a > 0).length && !clientSecret && !creatingIntent;

  if (sessionPaymentsDone && hasRemainingBalance) {
    const remaining = paymentInfo.totalAmount - totalPaidOverall;
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-amber-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Partial Payment Received</h2>
                <p className="text-foreground/60 mt-2">Your payments have been processed. A balance remains.</p>
              </div>
              <div className="space-y-2 text-left bg-white/5 rounded-xl p-4">
                {completedPayments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-foreground/60">Payment #{p.paymentNumber}</span>
                    <span className="font-bold text-green-400">${p.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Total Paid</span>
                    <span className="font-bold text-green-400">${totalPaidOverall.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Remaining Balance</span>
                    <span className="font-bold text-amber-400">${remaining.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400 font-bold">
                  Your booking will be confirmed once the full amount of ${paymentInfo.totalAmount.toFixed(2)} is paid.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => {
                    setSplitAmounts([remaining]);
                    setCompletedPayments([]);
                  }}
                  className="blue-gradient text-white border-none h-12 px-8 font-black uppercase tracking-widest text-xs"
                >
                  Pay Remaining ${remaining.toFixed(2)}
                </Button>
                <Button asChild variant="outline" className="border-white/10 h-12">
                  <Link href="/dashboard">Pay Later</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (allComplete) {
    const totalPaidThisSession = completedPayments.reduce((a, b) => a + b.amount, 0);
    const totalPaidOverall = totalPaidThisSession + (paymentInfo?.paidAmount || 0);
    
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">All Payments Complete!</h2>
                <p className="text-foreground/60 mt-2">Your booking has been fully paid and confirmed.</p>
              </div>
              <div className="space-y-2 text-left bg-white/5 rounded-xl p-4">
                {completedPayments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-foreground/60">Payment #{p.paymentNumber}</span>
                    <span className="font-bold text-green-400">${p.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total Paid</span>
                  <span className="text-primary">${totalPaidOverall.toFixed(2)}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 font-bold">Your installation has been confirmed and scheduled.</p>
              </div>
              <Button asChild className="blue-gradient text-white border-none h-12 px-8 font-black uppercase tracking-widest text-xs">
                <Link href="/dashboard">View My Bookings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
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
                <SplitSquareVertical className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Split Payment</CardTitle>
              <p className="text-foreground/60 text-sm mt-1">{paymentInfo?.serviceName}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 mt-2">Multiple Cards Supported</p>
            </CardHeader>


          <CardContent className="space-y-6">
            {paymentInfo && (
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Total Amount</span>
                  <span className="font-bold">${paymentInfo.totalAmount.toFixed(2)}</span>
                </div>
                {paymentInfo.paidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Already Paid</span>
                    <span className="font-bold text-green-400">${paymentInfo.paidAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                  <span className="text-foreground/60">Remaining</span>
                  <span className="font-bold text-primary">${paymentInfo.remainingAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {completedPayments.length > 0 && (
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                <h4 className="text-sm font-bold text-green-400 mb-2">Completed Payments</h4>
                {completedPayments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-foreground/60">Payment #{p.paymentNumber}</span>
                    <span className="font-bold text-green-400">${p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {!clientSecret && !creatingIntent && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold uppercase tracking-wider">Split Amounts</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={distributeSplitEvenly}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Split Evenly
                    </Button>
                  </div>

                  {splitAmounts.map((amount, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0.50"
                          value={amount || ''}
                          onChange={(e) => updateSplitAmount(index, parseFloat(e.target.value) || 0)}
                          className="pl-8 bg-white/5 border-white/10"
                          placeholder="0.00"
                        />
                      </div>
                      {splitAmounts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSplitPayment(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSplitPayment}
                    className="w-full border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Payment
                  </Button>

                  <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                    <span className="text-foreground/60">Total of splits</span>
                    <span className={`font-bold ${
                      Math.abs(splitAmounts.reduce((a, b) => a + b, 0) - (paymentInfo?.remainingAmount || 0)) < 0.01
                        ? 'text-green-400'
                        : 'text-amber-400'
                    }`}>
                      ${splitAmounts.reduce((a, b) => a + b, 0).toFixed(2)} / ${paymentInfo?.remainingAmount.toFixed(2)}
                    </span>
                  </div>
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
                        I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={startPayments}
                    disabled={!agreedToTOS || Math.abs(splitAmounts.reduce((a, b) => a + b, 0) - (paymentInfo?.remainingAmount || 0)) > 0.01}
                    className="w-full h-14 blue-gradient text-white border-none text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Start Split Payments ({splitAmounts.length})
                  </Button>
              </>
            )}

            {creatingIntent && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-foreground/60">Preparing payment {currentPaymentIndex + 1} of {splitAmounts.length}...</p>
              </div>
            )}

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
                <SplitPaymentForm
                  clientSecret={clientSecret}
                  bookingId={bookingId}
                  amount={splitAmounts[currentPaymentIndex]}
                  paymentNumber={currentPaymentIndex + 1}
                  remainingAfterThis={splitAmounts.slice(currentPaymentIndex + 1).reduce((a, b) => a + b, 0)}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            )}

            {error && clientSecret && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
