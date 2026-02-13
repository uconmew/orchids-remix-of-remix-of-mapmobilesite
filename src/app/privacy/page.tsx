import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-32 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Lock className="h-3 w-3" /> Data Protection
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-6">Privacy Policy</h1>
          <p className="text-foreground/60 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-white/5 space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary" />
              Information We Collect
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>We collect information that you provide directly to us when you book an appointment, create an account, or contact us. This may include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, email address, and phone number.</li>
                <li>Service address for mobile installations.</li>
                <li>Vehicle information (make, model, year).</li>
                <li>Payment information (processed securely via Stripe).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Server className="h-6 w-6 text-primary" />
              How We Use Your Information
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services.</li>
                <li>Schedule and confirm your installation appointments.</li>
                <li>Process payments and provide invoices.</li>
                <li>Communicate with you about your services or account.</li>
                <li>Send you newsletters or promotional materials (if you've opted in).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              Information Sharing
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>We do not sell your personal information. We may share your information with third-party service providers who perform services on our behalf, such as:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processors (Stripe).</li>
                <li>Cloud storage and database providers (Supabase).</li>
                <li>Email service providers.</li>
              </ul>
              <p>These providers are obligated to protect your information and only use it for the purposes we specify.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              Security
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              Your Choices
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>You may update or correct your account information at any time by logging into your account or contacting us. You can also opt out of receiving promotional emails by following the instructions in those emails.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
              Cookies
            </h2>
            <div className="text-foreground/70 leading-relaxed font-medium space-y-4">
              <p>We use cookies to enhance your experience on our website. Cookies are small data files stored on your hard drive or in device memory. You can set your browser to refuse all or some browser cookies, or to alert you when cookies are being sent.</p>
            </div>
          </section>
        </div>

        <div className="mt-16 text-center space-y-6">
          <p className="text-foreground/60 font-bold uppercase tracking-widest text-xs italic">Privacy concerns?</p>
          <div className="flex justify-center gap-4">
            <a href="mailto:privacy@MAPmobile.com" className="text-primary font-black uppercase italic hover:underline">privacy@MAPmobile.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
