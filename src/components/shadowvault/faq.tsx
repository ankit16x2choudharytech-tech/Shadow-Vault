"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How quickly do I get my product after paying?",
    a: "Instantly. The moment Razorpay verifies your payment signature, the product is unlocked in your dashboard and the download button activates. No manual approval, no waiting — typically under 30 seconds end to end.",
  },
  {
    q: "How does file delivery actually work?",
    a: "Purchased files are stored in a private Telegram channel. When you click download, our backend verifies your ownership, fetches the file via the Bot API, and serves it to you through a short-lived encrypted token. We never expose direct download links, so your purchase stays yours alone.",
  },
  {
    q: "Do I get future updates for free?",
    a: "Yes. Every purchase includes lifetime version updates for that product. When the seller uploads a new version, it automatically appears in your dashboard with full release notes — no extra payment required.",
  },
  {
    q: "What payment methods are supported?",
    a: "All Razorpay-supported methods: UPI (GPay, PhonePe, Paytm), credit & debit cards (Visa, Mastercard, RuPay), net banking across 50+ Indian banks, and popular wallets. Everything is 256-bit encrypted and PCI-DSS compliant.",
  },
  {
    q: "What is your refund policy?",
    a: "ShadowVault operates a strict NO REFUND policy. Because all products are digital and delivered instantly upon payment, we cannot offer refunds, exchanges, or cancellations once a product has been unlocked and downloaded. Please review product details, screenshots, and compatibility carefully before purchasing. In rare cases of verified duplicate charges or demonstrably non-functional products (with proof), our support team may offer a replacement file or store credit at its sole discretion — this is not a refund.",
  },
  {
    q: "Can I use coupon codes with referral discounts?",
    a: "Absolutely. Coupon codes (like WELCOME10 or SHADOW20) apply to your cart subtotal, and referral earnings are credited as wallet balance you can spend on any future order. They stack intelligently to maximise your savings.",
  },
  {
    q: "Is my account and payment data safe?",
    a: "We never store card numbers or net banking credentials — Razorpay handles all sensitive data. Passwords are bcrypt-hashed, sessions are JWT-protected, and every API request is rate-limited and audited. Admin accounts require 2FA.",
  },
  {
    q: "Can I sell my own products on ShadowVault?",
    a: "We're rolling out a creator program in 2025. Approved sellers get a full toolkit: product uploads, version management, analytics, coupon creation and instant payouts. Join the newsletter below to get early access.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-5"
          >
            <HelpCircle className="h-3.5 w-3.5 text-[var(--neon-violet)]" />
            Questions, answered
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-bold tracking-tight"
          >
            Frequently asked <span className="text-gradient">questions</span>
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="space-y-3"
          >
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="grad-border px-5 border-0 rounded-2xl overflow-hidden"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
