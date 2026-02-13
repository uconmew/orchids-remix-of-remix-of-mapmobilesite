import { motion } from "framer-motion";
import { DollarSign, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen py-32 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <DollarSign className="h-3 w-3" /> Billing & Refunds
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-6">Refund Policy</h1>
          <p className="text-foreground/60 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-white/5 space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-primary" />
              Service Refunds
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>At MAPmobile, we strive for 100% customer satisfaction. Our refund policy for services is as follows:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>If you are unsatisfied with the installation, please contact us within 48 hours. We will make every effort to rectify the issue at no additional cost.</li>
                <li>Labor charges are generally non-refundable once the service has been performed and accepted by the customer.</li>
                <li>In exceptional circumstances where a service cannot be completed due to our error, a full or partial refund of labor costs may be issued.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-primary" />
              Product Returns
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>For products purchased through MAPmobile:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Unopened products in original packaging can be returned within 15 days of purchase for a full refund, minus a 15% restocking fee.</li>
                <li>Installed products are non-returnable unless found to be defective within the manufacturer's warranty period.</li>
                <li>Defective products will be handled according to the manufacturer's warranty policy. We will assist with the warranty process, but labor charges for removal and re-installation may apply.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Appointment Deposits
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>If a deposit was required for your appointment:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Deposits are fully refundable if the appointment is cancelled at least 48 hours in advance.</li>
                <li>Cancellations within 24-48 hours will receive a 50% refund of the deposit.</li>
                <li>Cancellations with less than 24 hours notice or "no-shows" will forfeit the deposit.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              Refund Process
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>Approved refunds will be processed within 5-10 business days. Refunds will be issued to the original payment method used at the time of purchase. Please note that your financial institution may take additional time to post the refund to your account.</p>
            </div>
          </section>
        </div>

        <div className="mt-16 text-center space-y-6">
          <p className="text-foreground/60 font-bold uppercase tracking-widest text-xs italic">Need to request a refund?</p>
          <div className="flex justify-center gap-4">
            <a href="mailto:support@MAPmobile.com" className="text-primary font-black uppercase italic hover:underline">support@MAPmobile.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
