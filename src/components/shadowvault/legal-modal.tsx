"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, FileText, Ban, ScrollText, X } from "lucide-react";
import { useStore, type LegalDoc } from "@/lib/store";

const meta: Record<LegalDoc, { title: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  privacy: { title: "Privacy Policy", icon: ShieldCheck, color: "var(--neon-emerald)" },
  terms: { title: "Terms & Conditions", icon: FileText, color: "var(--neon-violet)" },
  refund: { title: "Refund Policy", icon: Ban, color: "var(--neon-pink)" },
};

export function LegalModal() {
  const { legalOpen, legalType, setLegalOpen } = useStore();

  return (
    <Dialog open={legalOpen} onOpenChange={setLegalOpen}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 glass-strong border-white/10 max-h-[90vh] overflow-hidden">
        <DialogTitle className="sr-only">
          {legalType ? meta[legalType].title : "Legal document"}
        </DialogTitle>

        {legalType && (
          <div className="overflow-y-auto max-h-[90vh] no-scrollbar">
            {/* header */}
            <div className="relative sticky top-0 z-10 glass-strong border-b border-white/10 p-5 flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
                style={{ background: `${meta[legalType].color}22` }}
              >
                {(() => {
                  const Icon = meta[legalType].icon;
                  return <Icon className="h-5 w-5" style={{ color: meta[legalType].color }} />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold leading-tight">
                  {meta[legalType].title}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLegalOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg glass hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={legalType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {legalType === "privacy" && <PrivacyContent />}
                  {legalType === "terms" && <TermsContent />}
                  {legalType === "refund" && <RefundContent />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* footer close button */}
            <div className="sticky bottom-0 glass-strong border-t border-white/10 p-4 flex justify-center">
              <button
                type="button"
                onClick={() => setLegalOpen(false)}
                className="btn-magnetic inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
        <ScrollText className="h-3.5 w-3.5 text-[var(--neon-violet)]" />
        {title}
      </h3>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2 pl-5">
        {children}
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        ShadowVault Technologies Pvt. Ltd. (&quot;ShadowVault&quot;, &quot;we&quot;,
        &quot;us&quot;) respects your privacy. This Privacy Policy explains how we
        collect, use, store, and protect your personal information when you use
        our platform.
      </p>

      <Section title="1. Information We Collect">
        <p>
          <strong className="text-foreground">Account data:</strong> Your name,
          email address, phone number, and encrypted password when you register.
        </p>
        <p>
          <strong className="text-foreground">Payment data:</strong> We do{" "}
          <em>not</em> store card numbers, CVV, or net banking credentials. All
          payment information is handled securely by Razorpay (PCI-DSS Level 1
          certified). We only store transaction IDs and payment status.
        </p>
        <p>
          <strong className="text-foreground">Usage data:</strong> Pages visited,
          products viewed, search queries, and device/browser information for
          analytics and fraud prevention.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>To process orders, deliver purchased files, and manage your account.</p>
        <p>To send order confirmations, product updates, and support responses.</p>
        <p>To prevent fraud, detect abuse, and enforce our Terms of Service.</p>
        <p>To improve our products, services, and user experience.</p>
      </Section>

      <Section title="3. Data Security">
        <p>
          Passwords are bcrypt-hashed and never stored in plain text. All API
          communication uses 256-bit SSL/TLS encryption. Sessions are JWT-protected
          and rate-limited. Admin accounts require two-factor authentication (2FA).
          File delivery uses short-lived encrypted tokens — we never expose direct
          download links.
        </p>
      </Section>

      <Section title="4. Data Retention">
        <p>
          We retain your account data for as long as your account is active.
          Purchase records are retained for 7 years as required by Indian tax law
          (GST). You may request deletion of your account at any time.
        </p>
      </Section>

      <Section title="5. Cookies & Local Storage">
        <p>
          We use local storage to remember your cart, wishlist, and login session.
          We do not use third-party tracking cookies. Analytics are collected
          anonymously.
        </p>
      </Section>

      <Section title="6. Your Rights (DPDP Act, 2023)">
        <p>Access: You can view all data we hold about you in your dashboard.</p>
        <p>Correction: You can update your profile details at any time.</p>
        <p>Deletion: You can request account deletion via support.</p>
        <p>Withdrawal: You can opt out of marketing emails anytime.</p>
      </Section>

      <Section title="7. Contact">
        <p>
          For privacy queries: <span className="text-[var(--neon-violet)]">privacy@shadowvault.in</span>
        </p>
      </Section>
    </div>
  );
}

function TermsContent() {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        By accessing or using ShadowVault, you agree to be bound by these Terms
        &amp; Conditions. If you do not agree, please do not use our platform.
      </p>

      <Section title="1. Eligibility">
        <p>
          You must be at least 18 years old and a resident of India to purchase
          products. By registering, you confirm you meet these requirements.
        </p>
      </Section>

      <Section title="2. Account Responsibility">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activities under your account. Notify us
          immediately of any unauthorized access.
        </p>
      </Section>

      <Section title="3. Digital Products & Licensing">
        <p>
          All products sold are digital goods delivered electronically. Each
          purchase grants you a <strong className="text-foreground">single-user,
          non-transferable license</strong> for personal use only. You may not:
        </p>
        <p>• Resell, redistribute, or share purchased files with others.</p>
        <p>• Reverse engineer, decompile, or extract source code.</p>
        <p>• Use products for commercial purposes without explicit permission.</p>
        <p>
          Violation of these terms results in immediate license revocation and
          account termination without refund.
        </p>
      </Section>

      <Section title="4. Payments">
        <p>
          All payments are processed securely through Razorpay. Prices are in
          Indian Rupees (INR) and inclusive of applicable GST (18%). Coupons and
          discounts are subject to terms displayed at the time of application.
        </p>
      </Section>

      <Section title="5. Refunds — NO REFUND POLICY">
        <p>
          <strong className="text-[var(--neon-pink)]">
            All sales are final. ShadowVault operates a strict NO REFUND policy.
          </strong>{" "}
          Since all products are digital and delivered instantly upon payment,
          we cannot offer refunds, exchanges, or cancellations once a product has
          been unlocked and downloaded. Please review product details, screenshots,
          and compatibility carefully before purchasing.
        </p>
        <p>
          In the rare event of a verified duplicate charge or a product that is
          demonstrably non-functional on supported systems (with proof), our
          support team may — at its sole discretion — offer a replacement file or
          store credit. This does not constitute a guarantee of refund.
        </p>
      </Section>

      <Section title="6. Product Updates">
        <p>
          Most products include free lifetime version updates. However, we reserve
          the right to discontinue any product or update offering at any time
          without prior notice.
        </p>
      </Section>

      <Section title="7. Acceptable Use">
        <p>You agree NOT to use ShadowVault to:</p>
        <p>• Violate any Indian law or the terms of service of any game.</p>
        <p>• Attempt to hack, overload, or disrupt the platform.</p>
        <p>• Use cheats, hacks, or tools that enable cheating in online games.</p>
        <p>• Bypass download protection or share download tokens.</p>
        <p>
          ShadowVault sells legitimate tools, configs, and utilities only. We do
          not condone cheating and are not liable for account bans resulting from
          misuse of purchased products.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          ShadowVault is not liable for any indirect, incidental, or consequential
          damages arising from the use of our products. Our maximum liability is
          limited to the amount paid for the specific product in question.
        </p>
      </Section>

      <Section title="9. Governing Law">
        <p>
          These terms are governed by the laws of India. Disputes will be subject
          to the exclusive jurisdiction of courts in Bengaluru, Karnataka.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For legal queries: <span className="text-[var(--neon-violet)]">legal@shadowvault.in</span>
        </p>
      </Section>
    </div>
  );
}

function RefundContent() {
  return (
    <div>
      {/* big no-refund banner */}
      <div className="relative grad-border p-6 mb-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[var(--neon-pink)]/10" />
        <div className="relative">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--neon-pink)]/20 mb-3">
            <Ban className="h-7 w-7 text-[var(--neon-pink)]" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-[var(--neon-pink)]">
            NO REFUND POLICY
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            All sales are final. No refunds, no exchanges.
          </p>
        </div>
      </div>

      <Section title="Why No Refunds?">
        <p>
          ShadowVault sells <strong className="text-foreground">digital products</strong>{" "}
          that are delivered instantly and automatically the moment your payment is
          verified. Unlike physical goods, digital files cannot be &quot;returned&quot; —
          once you&apos;ve downloaded a product, it cannot be un-delivered.
        </p>
        <p>
          This is why we strongly encourage you to review product descriptions,
          screenshots, system requirements, and compatibility information carefully
          before making a purchase.
        </p>
      </Section>

      <Section title="What About Faulty Products?">
        <p>
          If a product is demonstrably non-functional on supported systems (not
          user error), contact support within 48 hours of purchase with:
        </p>
        <p>• Your order number (e.g. SV-2025-10042)</p>
        <p>• A clear description of the issue</p>
        <p>• Screenshots or screen recording showing the problem</p>
        <p>
          Our team will investigate and, if the claim is verified, may offer a{" "}
          <strong className="text-foreground">replacement file or store credit</strong>{" "}
          at our sole discretion. This is not a refund.
        </p>
      </Section>

      <Section title="What About Duplicate Charges?">
        <p>
          If you were charged twice for the same order due to a payment gateway
          error, contact support with both transaction IDs. Verified duplicate
          charges will be reversed within 5-7 business days.
        </p>
      </Section>

      <Section title="Chargeback Abuse">
        <p>
          Initiating fraudulent chargebacks or payment disputes to obtain products
          for free will result in immediate account termination, revocation of all
          purchased licenses, and permanent ban from the platform. We actively
          cooperate with Razorpay and banks to contest illegitimate chargebacks.
        </p>
      </Section>

      <Section title="Before You Buy — Checklist">
        <p>✓ Check the product&apos;s compatibility matches your system.</p>
        <p>✓ Review screenshots and feature list.</p>
        <p>✓ Read verified customer reviews.</p>
        <p>✓ Confirm the version is current.</p>
        <p>✓ Understand this is a digital, non-refundable purchase.</p>
      </Section>

      <Section title="Contact Support">
        <p>
          Email: <span className="text-[var(--neon-violet)]">support@shadowvault.in</span>
        </p>
        <p>Response time: within 24 hours, Mon–Sat.</p>
      </Section>
    </div>
  );
}
