import { motion } from "framer-motion";
import { Shield, FileText, Scale, Clock } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-32 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Scale className="h-3 w-3" /> Legal Information
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-6">Terms of Service</h1>
          <p className="text-foreground/60 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-white/5 space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">1</span>
              Agreement to Terms
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>By accessing or using MAPmobile's services, including our website and mobile installation services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
              <p>MAPmobile is a mobile automotive and marine electronics installation service operating in the Denver Metro area. These terms apply to all visitors, users, and customers of our services.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">2</span>
              Service Appointments
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>Appointments are scheduled based on availability. We require a valid address within our Denver Metro service area for all mobile installations.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Customers must provide a safe and legal location for installation (private driveway, garage, etc.).</li>
                <li>An adult (18+) must be present for the duration of the installation or at the beginning and end as agreed upon.</li>
                <li>Cancellations or rescheduling requests must be made at least 24 hours in advance.</li>
              </ul>
            </div>
          </section>

<section className="space-y-4">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">3</span>
                Pricing and Payment
              </h2>
              <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
                <p>Estimates provided are based on information given by the customer. Final pricing may vary if the vehicle requires additional parts or labor not initially identified.</p>
                <p className="font-bold text-foreground/90">Full payment of the Grand Total is a mandatory prerequisite for the commencement of any installation or service provision. Exceptions to this policy will only be considered if substantiated by a formally executed, written agreement.</p>
                <p>We accept major credit cards and other electronic payment methods as facilitated through our website.</p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4">
                  <h4 className="font-black text-amber-400 uppercase text-sm mb-2">Pay on Arrival Option</h4>
                  <p className="text-amber-400/80">When selecting the &quot;Pay on Arrival&quot; payment option, a non-refundable $10.00 arrival fee must be paid at the time of booking to secure your appointment. The remaining balance is due upon the technician&apos;s arrival before any work commences. The arrival fee is applied toward your total and is required for all Pay on Arrival bookings.</p>
                </div>
              </div>
            </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">4</span>
              Warranty and Liability
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>MAPmobile warrants the labor for our installations for a period of 12 months from the date of service. This warranty covers the installation work only, not the products themselves.</p>
              <p>Product warranties are provided by the respective manufacturers. We are not responsible for manufacturer defects.</p>
              <p>To the maximum extent permitted by law, MAPmobile shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use of our services.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">5</span>
              Customer-Provided Equipment
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>While we install customer-provided equipment, we do not warrant the functionality of such equipment. If equipment is found to be defective during or after installation, additional labor charges may apply for diagnosis or replacement.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">6</span>
              Changes to Terms
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>We reserve the right to modify these terms at any time. Any changes will be effective immediately upon posting to our website. Your continued use of our services following any changes indicates your acceptance of the new terms.</p>
            </div>
          </section>
        </div>

        <div className="mt-16 text-center space-y-6">
          <p className="text-foreground/60 font-bold uppercase tracking-widest text-xs italic">Have questions about our terms?</p>
          <div className="flex justify-center gap-4">
            <a href="mailto:legal@MAPmobile.com" className="text-primary font-black uppercase italic hover:underline">legal@MAPmobile.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
