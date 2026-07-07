"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

export function LoadingScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-[oklch(0.13_0.018_280)]"
        >
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-[var(--neon-violet)] blur-2xl opacity-60 animate-pulse" />
              <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] glow-violet">
                <Shield className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-bold text-xl tracking-tight"
            >
              Shadow<span className="text-gradient">Vault</span>
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.3, duration: 0.9, ease: "easeInOut" }}
              className="h-0.5 mt-4 rounded-full bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)]"
            />
            <p className="text-[11px] text-muted-foreground mt-3 uppercase tracking-[0.2em]">
              Securing the vault…
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
