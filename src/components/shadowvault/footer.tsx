"use client";

import {
  Shield,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  Send,
} from "lucide-react";
import { useStore, type LegalDoc } from "@/lib/store";
import { toast } from "sonner";

// Map footer label → category slug for marketplace filtering
const categorySlugMap: Record<string, string> = {
  "Game Panels": "game-panels",
  "Private Tools": "private-tools",
  "Configs": "configs",
  "Premium Files": "premium-files",
  "Subscriptions": "subscriptions",
};

const legalLinkMap: Record<string, LegalDoc> = {
  "Refund Policy": "refund",
  "Terms of Service": "terms",
  "Privacy Policy": "privacy",
};

const marketplaceLinks = [
  "Game Panels",
  "Private Tools",
  "Configs",
  "Premium Files",
  "Subscriptions",
];
const companyLinks = [
  "About Us",
  "Careers",
  "Press Kit",
  "Affiliate Program",
  "Contact",
];
const supportLinks = [
  "Help Center",
  "Track Order",
  "Refund Policy",
  "Terms of Service",
  "Privacy Policy",
];

export function Footer() {
  const { setView, setCategory, setLegal, customerEmail } = useStore();

  const handleMarketplaceLink = (label: string) => {
    const slug = categorySlugMap[label];
    if (slug) {
      setCategory(slug);
      setView("marketplace");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCompanyLink = (label: string) => {
    if (label === "Contact") {
      window.open("mailto:hello@shadowvault.in", "_blank");
      return;
    }
    if (label === "Affiliate Program") {
      toast.info("Affiliate program coming soon!", {
        description: "Join the newsletter to get early access.",
      });
      return;
    }
    toast.info(`${label}`, {
      description: "This section is coming soon. Stay tuned!",
    });
  };

  const handleSupportLink = (label: string) => {
    const legalType = legalLinkMap[label];
    if (legalType) {
      setLegal(legalType);
      return;
    }
    if (label === "Help Center") {
      setLegal("refund"); // open refund policy as help landing
      return;
    }
    if (label === "Track Order") {
      if (customerEmail) {
        setView("dashboard");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.info("Please sign in to track your orders.");
      }
      return;
    }
  };

  return (
    <footer className="relative mt-auto border-t border-white/10 glass-strong">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] glow-violet">
                <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg">
                Shadow<span className="text-gradient">Vault</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              India&apos;s most premium digital delivery platform for game
              panels, mods, configs and premium files. Instant payment, instant
              unlock, secure delivery.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {[Twitter, Instagram, Youtube, MessageCircle, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="grid h-9 w-9 place-items-center rounded-lg glass hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace column */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              {marketplaceLinks.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    onClick={() => handleMarketplaceLink(l)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    onClick={() => handleCompanyLink(l)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5">
              {supportLinks.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    onClick={() => handleSupportLink(l)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* trust badges */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* <Badge label="Razorpay Verified" />
            <Badge label="PCI-DSS Compliant" />
            <Badge label="256-bit SSL" />
            <Badge label="GST Registered" /> */}
          </div>
          <a
            href="mailto:supportxinfo@gmail.com"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" />
            supportxinfo@gmail.com
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ShadowVault · Made in India 🇮🇳</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setLegal("privacy")}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => setLegal("terms")}
              className="hover:text-foreground transition-colors"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setLegal("refund")}
              className="hover:text-foreground transition-colors"
            >
              No Refund Policy
            </button>
            <span className="text-center sm:text-right">
              All products are for legitimate use only.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md glass px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-emerald)]" />
      {label}
    </span>
  );
}
