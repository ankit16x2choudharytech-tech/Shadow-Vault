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
import { useStore } from "@/lib/store";

const cols = [
  {
    title: "Marketplace",
    links: ["Game Panels", "Private Tools", "Configs", "Premium Files", "Subscriptions"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Press Kit", "Affiliate Program", "Contact"],
  },
  {
    title: "Support",
    links: ["Help Center", "Track Order", "Refund Policy", "Terms of Service", "Privacy Policy"],
  },
];

export function Footer() {
  const { setView } = useStore();
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

          {/* link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => setView("marketplace")}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* trust badges */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Badge label="Razorpay Verified" />
            <Badge label="PCI-DSS Compliant" />
            <Badge label="256-bit SSL" />
            <Badge label="GST Registered" />
          </div>
          <a
            href="mailto:hello@shadowvault.in"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" />
            hello@shadowvault.in
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ShadowVault Technologies Pvt. Ltd. · Made in India 🇮🇳</p>
          <p className="text-center sm:text-right">
            All products are for legitimate use only. Misuse may violate game terms of service.
          </p>
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
