"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Mail,
  Lock,
  User,
  Gift,
  Loader2,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Crown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

// Admin access is gated behind a secret access code so regular users cannot
// self-elevate to admin and download products for free. To sign in as admin,
// a user must know this code. Change it before production deployment.
const ADMIN_ACCESS_CODE = "VAULT-ADMIN-2025";

export function AuthModal() {
  const { authOpen, setAuthOpen, login, setView } = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // admin access sub-view
  const [adminMode, setAdminMode] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    referral: "",
  });

  const reset = () => {
    setDone(false);
    setAdminMode(false);
    setAdminCode("");
    setAdminError(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);

    try {
      if (mode === "register") {
        // register a new customer account
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim() || "New Gamer",
            email: form.email.trim(),
            password: form.password,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Registration failed");
        const u = json.data ?? json.user;
        login("customer", u.name, u.email);
        toast.success(`Account created — welcome, ${u.name}!`);
      } else {
        // real login — validate against the User table
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            role: "customer",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Login failed");
        const u = json.data ?? json.user;
        login(u.role as "customer" | "admin", u.name, u.email);
        toast.success(`Welcome back, ${u.name}!`);
      }
      setLoading(false);
      setAuthOpen(false);
      setView("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setDone(true);
      setTimeout(() => setDone(false), 700);
    } catch (err) {
      setLoading(false);
      toast.error("Login failed", {
        description: (err as Error).message,
      });
    }
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Admin login now validates against the User table (role=admin) using
    // the email + password. The access code is an additional gate.
    if (adminCode.trim().toUpperCase() !== ADMIN_ACCESS_CODE) {
      setLoading(false);
      setAdminError(true);
      toast.error("Invalid admin access code");
      return;
    }

    try {
      const email = form.email.trim() || "admin@shadowvault.in";
      const password = form.password || "admin123";
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Admin login failed");
      const u = json.data ?? json.user;
      login("admin", u.name, u.email);
      toast.success(`Admin access granted, ${u.name}!`);
      setLoading(false);
      setAuthOpen(false);
      setView("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
      reset();
    } catch (err) {
      setLoading(false);
      toast.error("Admin login failed", {
        description: (err as Error).message,
      });
    }
  };

  return (
    <Dialog
      open={authOpen}
      onOpenChange={(o) => {
        setAuthOpen(o);
        if (!o) setTimeout(reset, 300);
      }}
    >
      <DialogContent className="max-w-md w-[95vw] p-0 gap-0 glass-strong border-white/10 overflow-hidden">
        <DialogTitle className="sr-only">
          {adminMode ? "Admin sign in" : mode === "login" ? "Sign in" : "Create account"}
        </DialogTitle>

        {/* header */}
        <div
          className={cn(
            "relative p-6 text-center",
            adminMode
              ? "bg-gradient-to-br from-[var(--neon-amber)]/30 to-[var(--neon-pink)]/20"
              : "bg-gradient-to-br from-[var(--neon-violet)]/30 to-[var(--neon-pink)]/20"
          )}
        >
          <div className="absolute inset-0 grid-overlay opacity-40" />
          <div className="relative">
            <div
              className={cn(
                "mx-auto grid h-12 w-12 place-items-center rounded-2xl mb-3",
                adminMode
                  ? "bg-gradient-to-br from-[var(--neon-amber)] to-[var(--neon-pink)] glow-amber"
                  : "bg-gradient-to-br from-[var(--neon-violet)] to-[var(--neon-pink)] glow-violet"
              )}
            >
              {adminMode ? (
                <Crown className="h-6 w-6 text-white" strokeWidth={2.5} />
              ) : (
                <Shield className="h-6 w-6 text-white" strokeWidth={2.5} />
              )}
            </div>
            <h2 className="text-xl font-bold">
              {done
                ? "All set!"
                : adminMode
                ? "Admin Access"
                : mode === "login"
                ? "Welcome back"
                : "Join ShadowVault"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {done
                ? "Redirecting you to your dashboard…"
                : adminMode
                ? "Enter your admin access code to continue"
                : mode === "login"
                ? "Sign in to access your downloads & orders"
                : "Create an account to start buying premium files"}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 16 }}
                className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-emerald)] to-[var(--neon-cyan)] glow-emerald mb-4"
              >
                <CheckCircle2 className="h-9 w-9 text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          ) : adminMode ? (
            <motion.form
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={submitAdmin}
              className="p-6 space-y-4"
            >
              <FieldRow icon={KeyRound} label="Admin Access Code">
                <Input
                  type="password"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    setAdminError(false);
                  }}
                  placeholder="Enter admin access code"
                  className={cn(
                    "bg-white/5 border-white/10",
                    adminError && "border-[var(--neon-pink)]/50 focus-visible:ring-[var(--neon-pink)]/20"
                  )}
                  autoFocus
                />
              </FieldRow>
              {adminError && (
                <p className="text-xs text-[var(--neon-pink)] -mt-2">
                  Invalid access code. Please contact the platform owner.
                </p>
              )}

              <FieldRow icon={Mail} label="Admin Email (optional)">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@shadowvault.in"
                  className="bg-white/5 border-white/10"
                />
              </FieldRow>

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-magnetic h-11 bg-gradient-to-r from-[var(--neon-amber)] to-[var(--neon-pink)] text-white border-0 glow-amber"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {loading ? "Verifying…" : "Verify & Sign In as Admin"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setAdminMode(false);
                  setAdminCode("");
                  setAdminError(false);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to customer sign in
              </button>
            </motion.form>
          ) : (
            <motion.form
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={submit}
              className="p-6 space-y-4"
            >
              {mode === "register" && (
                <FieldRow icon={User} label="Username">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your gamer tag"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </FieldRow>
              )}

              <FieldRow icon={Mail} label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@email.com"
                  className="bg-white/5 border-white/10"
                  required
                />
              </FieldRow>

              <FieldRow icon={Lock} label="Password">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10"
                  required
                />
              </FieldRow>

              {mode === "register" && (
                <FieldRow icon={Gift} label="Referral Code (optional)">
                  <Input
                    value={form.referral}
                    onChange={(e) => setForm({ ...form, referral: e.target.value })}
                    placeholder="e.g. ARJUN500"
                    className="bg-white/5 border-white/10"
                  />
                </FieldRow>
              )}

              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => toast.info("OTP sent to your email (demo)")}
                    className="text-xs text-[var(--neon-violet)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-magnetic h-11 bg-gradient-to-r from-[var(--neon-violet)] to-[var(--neon-pink)] text-white border-0 glow-violet"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {loading
                  ? "Please wait…"
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </Button>

              {/* divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  or
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.location.href = "/api/auth/google";
                }}
                className="w-full h-11 glass border-white/15 hover:bg-white/10"
              >
                <GoogleIcon className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? "New to ShadowVault?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="text-[var(--neon-violet)] font-medium hover:underline"
                >
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>

              {/* subtle admin access link */}
              <div className="pt-2 border-t border-white/5 text-center">
                <button
                  type="button"
                  onClick={() => setAdminMode(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-[var(--neon-amber)] transition-colors"
                >
                  <KeyRound className="h-3 w-3" />
                  Admin access
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      {children}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
