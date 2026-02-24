"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Info,
  ArrowRight,
  Zap,
  FlaskConical,
  Key,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { cn, decodeJWT, copyToClipboard, formatTimestamp, generatePKCE } from "@/lib/utils";

// ─── Sample JWT ───────────────────────────────────────────────────────────────
const SAMPLE_JWT =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xMjMifQ.eyJzdWIiOiJ1c2VyXzQ4MjkiLCJuYW1lIjoiSmFuZSBEb2UiLCJlbWFpbCI6ImphbmVAZXhhbXBsZS5jb20iLCJpc3MiOiJodHRwczovL29hdXRoLmV4YW1wbGUuY29tIiwiYXVkIjoiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMCwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImp0aSI6ImFiYzEyMyJ9.signature";

// ─── Claim Descriptions ───────────────────────────────────────────────────────
const CLAIM_INFO: Record<string, { label: string; description: string; color: string }> = {
  sub: { label: "Subject", description: "Unique identifier for the token's subject (the user). Stable across sessions.", color: "text-blue-600 dark:text-blue-400" },
  iss: { label: "Issuer", description: "URL of the authorization server that issued this token. Must match your expected issuer.", color: "text-purple-600 dark:text-purple-400" },
  aud: { label: "Audience", description: "Identifier of the resource server(s) this token is intended for. Your API must validate it appears here.", color: "text-orange-600 dark:text-orange-400" },
  exp: { label: "Expiration", description: "Unix timestamp after which the token must not be accepted. Always validate this.", color: "text-red-600 dark:text-red-400" },
  iat: { label: "Issued At", description: "Unix timestamp when the token was issued. Can be used to detect unusually old tokens.", color: "text-green-600 dark:text-green-400" },
  nbf: { label: "Not Before", description: "Token must not be accepted before this Unix timestamp. Useful for future-dated tokens.", color: "text-yellow-600 dark:text-yellow-400" },
  jti: { label: "JWT ID", description: "Unique identifier for this specific token. Used to detect token replay attacks.", color: "text-teal-600 dark:text-teal-400" },
  scope: { label: "Scope", description: "Space-separated list of permissions granted. Always validate required scope per endpoint.", color: "text-indigo-600 dark:text-indigo-400" },
  name: { label: "Name", description: "Human-readable display name for the subject. From the OIDC profile scope.", color: "text-muted-foreground" },
  email: { label: "Email", description: "Email address of the subject. Requires the email scope. May not be verified.", color: "text-muted-foreground" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tool 1: JWT Token Inspector
// ─────────────────────────────────────────────────────────────────────────────
function TokenInspector() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof decodeJWT> | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const decode = useCallback((value: string) => {
    if (!value.trim()) {
      setResult(null);
      return;
    }
    setResult(decodeJWT(value));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    decode(e.target.value);
  };

  const loadExample = () => {
    setInput(SAMPLE_JWT);
    decode(SAMPLE_JWT);
  };

  const clear = () => {
    setInput("");
    setResult(null);
  };

  const handleCopy = async (key: string, text: string) => {
    await copyToClipboard(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const formatValue = (key: string, value: unknown): string => {
    if ((key === "exp" || key === "iat" || key === "nbf") && typeof value === "number") {
      return `${value} (${formatTimestamp(value)})`;
    }
    return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  };

  const warningIcon = (w: string) => {
    if (w.startsWith("CRITICAL")) return <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    if (w.startsWith("WARNING") || w.startsWith("EXPIRED")) return <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
    return <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  };

  const warningClass = (w: string) => {
    if (w.startsWith("CRITICAL")) return "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
    if (w.startsWith("WARNING") || w.startsWith("EXPIRED")) return "border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400";
    return "border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400";
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <label className="text-sm font-medium">Paste JWT Token</label>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={loadExample} className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5" />
              Load Example
            </Button>
            {input && (
              <Button size="sm" variant="ghost" onClick={clear} className="gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <textarea
          value={input}
          onChange={handleChange}
          placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ4MjkiLCJpc3MiOiJodHRwcz..."
          className={cn(
            "w-full h-28 px-3 py-2.5 rounded-lg border bg-muted/30 font-mono text-xs resize-none",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30",
            "transition-colors"
          )}
        />
        {input && result && !result.valid && (
          <p className="text-xs text-red-500 mt-1">Invalid JWT format. JWTs have three base64url-encoded parts separated by dots.</p>
        )}
      </div>

      <AnimatePresence>
        {result && result.valid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* JWT Structure */}
            <div className="flex gap-1 flex-wrap">
              {input.split(".").map((part, i) => (
                <React.Fragment key={i}>
                  <span className={cn(
                    "text-xs font-mono px-2 py-1 rounded",
                    i === 0 && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
                    i === 1 && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                    i === 2 && "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                  )}>
                    {part.length > 20 ? part.slice(0, 20) + "..." : part}
                  </span>
                  {i < 2 && <span className="text-muted-foreground self-center text-xs">.</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="grid gap-4">
              {/* Header */}
              <SectionCard
                title="Header"
                colorClass="border-l-orange-400"
                badgeClass="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                copyKey="header"
                copyValue={JSON.stringify(result.header, null, 2)}
                copiedSection={copiedSection}
                onCopy={handleCopy}
              >
                <div className="space-y-1.5">
                  {Object.entries(result.header).map(([k, v]) => (
                    <ClaimRow key={k} claimKey={k} value={String(v)} formatValue={formatValue} />
                  ))}
                </div>
              </SectionCard>

              {/* Payload */}
              <SectionCard
                title="Payload"
                colorClass="border-l-green-400"
                badgeClass="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                copyKey="payload"
                copyValue={JSON.stringify(result.payload, null, 2)}
                copiedSection={copiedSection}
                onCopy={handleCopy}
              >
                <div className="space-y-2">
                  {Object.entries(result.payload).map(([k, v]) => (
                    <ClaimRow key={k} claimKey={k} value={v} formatValue={formatValue} />
                  ))}
                </div>
              </SectionCard>

              {/* Signature */}
              <SectionCard
                title="Signature"
                colorClass="border-l-purple-400"
                badgeClass="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                copyKey="signature"
                copyValue={result.signature}
                copiedSection={copiedSection}
                onCopy={handleCopy}
              >
                <p className="font-mono text-xs text-muted-foreground break-all">{result.signature}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  The signature verifies the token was issued by the expected authorization server and has not been tampered with.
                  It cannot be verified client-side without the public key from the JWKS endpoint.
                </p>
              </SectionCard>
            </div>

            {/* Security Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Security Analysis</h3>
                {result.warnings.map((w, i) => (
                  <div key={i} className={cn("flex items-start gap-2 rounded-lg border p-3 text-xs", warningClass(w))}>
                    {warningIcon(w)}
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {result.warnings.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-3 text-xs text-green-700 dark:text-green-400">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>No obvious security issues detected in the token structure. Remember: signature verification must happen server-side.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!input && (
        <div className="text-center py-8 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Paste a JWT above or click "Load Example" to see the decoded output.</p>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  colorClass,
  badgeClass,
  copyKey,
  copyValue,
  copiedSection,
  onCopy,
  children,
}: {
  title: string;
  colorClass: string;
  badgeClass: string;
  copyKey: string;
  copyValue: string;
  copiedSection: string | null;
  onCopy: (key: string, value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border-l-4 border border-border p-4 space-y-3", colorClass)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", badgeClass)}>{title}</span>
        <button
          onClick={() => onCopy(copyKey, copyValue)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copiedSection === copyKey
            ? <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Copied</span></>
            : <><Copy className="w-3 h-3" /><span>Copy</span></>
          }
        </button>
      </div>
      {children}
    </div>
  );
}

function ClaimRow({ claimKey, value, formatValue }: { claimKey: string; value: unknown; formatValue: (k: string, v: unknown) => string }) {
  const info = CLAIM_INFO[claimKey];
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="flex items-start gap-2 group">
      <div className="flex items-center gap-1 shrink-0 min-w-0">
        <span className={cn(
          "font-mono text-xs font-semibold",
          info ? info.color : "text-muted-foreground"
        )}>
          {claimKey}
        </span>
        {info && (
          <button
            onClick={() => setShowTip((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            <Info className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-muted-foreground break-all">
          {formatValue(claimKey, value)}
        </span>
        <AnimatePresence>
          {showTip && info && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-muted-foreground mt-1 leading-relaxed italic"
            >
              {info.label}: {info.description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool 2: Grant Type Decision Tree
// ─────────────────────────────────────────────────────────────────────────────
type QuestionId = "q1" | "q2" | "q3";
type AnswerId =
  | "q1-web"
  | "q1-spa"
  | "q1-mobile"
  | "q1-backend"
  | "q2-user-yes"
  | "q2-user-no"
  | "q3-browser-yes"
  | "q3-browser-no";

interface Question {
  id: QuestionId;
  text: string;
  answers: { id: AnswerId; label: string; next: QuestionId | "recommend"; recommendation?: RecommendationId }[];
}

type RecommendationId =
  | "auth-code-pkce"
  | "client-credentials"
  | "device-flow"
  | "auth-code-pkce-mobile";

interface Recommendation {
  id: RecommendationId;
  name: string;
  badge: string;
  badgeVariant: "success" | "warning" | "info";
  why: string;
  href: string;
  notes: string[];
}

const questions: Record<QuestionId, Question> = {
  q1: {
    id: "q1",
    text: "What type of application are you building?",
    answers: [
      { id: "q1-web", label: "Web app with server-side component", next: "q2" },
      { id: "q1-spa", label: "Single-Page App (no backend)", next: "recommend", recommendation: "auth-code-pkce" },
      { id: "q1-mobile", label: "Mobile / Desktop app", next: "recommend", recommendation: "auth-code-pkce-mobile" },
      { id: "q1-backend", label: "Backend service / script / CI", next: "q3" },
    ],
  },
  q2: {
    id: "q2",
    text: "Does a human user need to log in?",
    answers: [
      { id: "q2-user-yes", label: "Yes, users authenticate", next: "recommend", recommendation: "auth-code-pkce" },
      { id: "q2-user-no", label: "No, service-to-service only", next: "recommend", recommendation: "client-credentials" },
    ],
  },
  q3: {
    id: "q3",
    text: "Does the device or environment have access to a browser?",
    answers: [
      { id: "q3-browser-yes", label: "Yes, can open a browser", next: "recommend", recommendation: "auth-code-pkce" },
      { id: "q3-browser-no", label: "No — CLI tool, TV, IoT device", next: "recommend", recommendation: "device-flow" },
    ],
  },
};

const recommendations: Record<RecommendationId, Recommendation> = {
  "auth-code-pkce": {
    id: "auth-code-pkce",
    name: "Authorization Code + PKCE",
    badge: "Recommended",
    badgeVariant: "success",
    why: "This is the correct flow for any application where a user needs to authenticate. The authorization code is exchanged server-side (or protected by PKCE for public clients), preventing token leakage in the browser. PKCE adds cryptographic protection against code interception even without a client secret.",
    href: "/flows/authorization-code",
    notes: [
      "Generate a cryptographically random state parameter for CSRF protection",
      "Generate a code_verifier and code_challenge (S256) for PKCE",
      "Exchange the authorization code on the server — never in the browser",
      "Store refresh tokens in httpOnly cookies or server-side session",
      "Validate the state parameter before exchanging the code",
    ],
  },
  "auth-code-pkce-mobile": {
    id: "auth-code-pkce-mobile",
    name: "Authorization Code + PKCE",
    badge: "Required for Mobile",
    badgeVariant: "success",
    why: "Mobile apps are public clients — they cannot securely store a client_secret. PKCE was originally invented specifically for mobile OAuth (RFC 7636). Use a system browser (SFSafariViewController on iOS, Custom Tabs on Android) — never an embedded WebView, which allows the app to intercept credentials.",
    href: "/flows/authorization-code",
    notes: [
      "Use AppAuth library (iOS/Android) — battle-tested PKCE implementation",
      "Use Universal Links (iOS) or App Links (Android) for redirect URIs",
      "Store tokens in iOS Keychain or Android Keystore — never SharedPreferences",
      "Never use embedded WebViews — use SFSafariViewController / Custom Tabs",
      "PKCE S256 is mandatory — no client_secret in the app bundle",
    ],
  },
  "client-credentials": {
    id: "client-credentials",
    name: "Client Credentials",
    badge: "Machine-to-Machine",
    badgeVariant: "info",
    why: "When no user is involved — only one service authenticating to another — Client Credentials is the right flow. The service authenticates directly with its client_id and client_secret (or a client certificate). No user consent, no redirect, no browser required.",
    href: "/flows/client-credentials",
    notes: [
      "Store client_secret in environment variables or a secrets manager (Vault, AWS Secrets Manager)",
      "Scope the token to only what the service needs (principle of least privilege)",
      "Cache access tokens until near-expiry — don't request a new one per API call",
      "Rotate client secrets regularly; implement zero-downtime rotation",
      "Consider mTLS client authentication for higher assurance environments",
    ],
  },
  "device-flow": {
    id: "device-flow",
    name: "Device Authorization Flow",
    badge: "CLI & IoT",
    badgeVariant: "warning",
    why: "For devices that cannot open a browser or have limited input capability. The device displays a short code and a URL. The user enters the code on a secondary device (phone, computer). The device polls the token endpoint until the user completes authorization.",
    href: "/flows/device",
    notes: [
      "Display the user_code prominently — users type it on another device",
      "Show the verification_uri_complete if available (includes the code as a QR/link)",
      "Poll the token endpoint at the interval specified — respect slow_down responses",
      "Handle expired codes gracefully — restart the flow with a new device_code",
      "Set a reasonable timeout (10-15 min) matching the expires_in from the device response",
    ],
  },
};

function GrantTypeWizard() {
  const [history, setHistory] = useState<QuestionId[]>(["q1"]);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerId[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationId | null>(null);

  const currentQuestion = recommendation ? null : questions[history[history.length - 1]];

  const handleAnswer = (answer: (typeof questions)[QuestionId]["answers"][0]) => {
    if (answer.next === "recommend" && answer.recommendation) {
      setSelectedAnswers((prev) => [...prev, answer.id]);
      setRecommendation(answer.recommendation);
    } else {
      setHistory((prev) => [...prev, answer.next as QuestionId]);
      setSelectedAnswers((prev) => [...prev, answer.id]);
    }
  };

  const goBack = () => {
    if (recommendation) {
      setRecommendation(null);
      setSelectedAnswers((prev) => prev.slice(0, -1));
    } else if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
      setSelectedAnswers((prev) => prev.slice(0, -1));
    }
  };

  const reset = () => {
    setHistory(["q1"]);
    setSelectedAnswers([]);
    setRecommendation(null);
  };

  const rec = recommendation ? recommendations[recommendation] : null;

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {["q1", "q2/q3"].map((step, i) => {
          const active = !recommendation && (i === 0 ? history.length === 1 : history.length > 1);
          const done = recommendation || (i === 0 && history.length > 1);
          return (
            <React.Fragment key={step}>
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                done ? "bg-primary" : active ? "bg-primary/60" : "bg-muted"
              )} />
              {i === 0 && <div className="flex-1 h-px bg-border" />}
            </React.Fragment>
          );
        })}
        <div className={cn(
          "w-2 h-2 rounded-full transition-colors",
          recommendation ? "bg-primary" : "bg-muted"
        )} />
      </div>

      <AnimatePresence mode="wait">
        {!rec ? (
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Question {history.length} of up to 2
              </p>
              <h3 className="text-base font-semibold">{currentQuestion?.text}</h3>
            </div>

            <div className="grid gap-2">
              {currentQuestion?.answers.map((answer) => (
                <motion.button
                  key={answer.id}
                  onClick={() => handleAnswer(answer)}
                  className="w-full text-left px-4 py-3 rounded-lg border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors duration-150 flex items-center gap-3 group"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary flex items-center justify-center shrink-0 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  </div>
                  <span className="text-sm">{answer.label}</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                </motion.button>
              ))}
            </div>

            {history.length > 1 && (
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="recommendation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Recommendation</p>
            </div>

            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">{rec?.name}</CardTitle>
                  <Badge variant={rec?.badgeVariant}>{rec?.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{rec?.why}</p>

                <Separator />

                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Key Implementation Notes</p>
                  <ul className="space-y-1.5">
                    {rec?.notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button asChild size="sm">
                    <Link href={rec?.href ?? "#"}>
                      View Flow Details
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={goBack} className="gap-1.5">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>

            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool 3: PKCE Generator
// ─────────────────────────────────────────────────────────────────────────────
async function sha256Base64url(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = String.fromCharCode(...hashArray);
  return btoa(hashString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

interface PKCEValues {
  verifier: string;
  challenge: string;
  method: "S256";
}

function PKCEGenerator() {
  const [values, setValues] = useState<PKCEValues | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      const verifier = generateVerifier();
      const challenge = await sha256Base64url(verifier);
      setValues({ verifier, challenge, method: "S256" });
    } catch {
      // fallback if subtle crypto not available
      const { verifier, challenge } = generatePKCE();
      setValues({ verifier, challenge, method: "S256" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (key: string, value: string) => {
    await copyToClipboard(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const clientId = "my-app";
  const redirectUri = "https://app.example.com/callback";

  const authUrl = values
    ? `https://auth.example.com/authorize
  ?response_type=code
  &client_id=${clientId}
  &redirect_uri=${redirectUri}
  &scope=openid profile email
  &state=<random-state>
  &code_challenge=${values.challenge}
  &code_challenge_method=S256`
    : "";

  const tokenRequest = values
    ? `POST https://auth.example.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<authorization-code>
&redirect_uri=${redirectUri}
&client_id=${clientId}
&code_verifier=${values.verifier}`
    : "";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PKCE (Proof Key for Code Exchange) uses a cryptographic challenge to bind the authorization request
          to the token exchange. Generate fresh values for each authorization attempt.
        </p>
      </div>

      <Button onClick={generate} className="gap-2" disabled={generating}>
        <RefreshCw className={cn("w-4 h-4", generating && "animate-spin")} />
        {generating ? "Generating..." : "Generate PKCE Values"}
      </Button>

      <AnimatePresence>
        {values && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Verifier */}
            <PKCEValueCard
              label="code_verifier"
              sublabel="Random secret — never sent to the authorization server, only used in the token request"
              value={values.verifier}
              copyKey="verifier"
              copied={copied}
              onCopy={handleCopy}
              colorClass="border-l-blue-400"
              badgeClass="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            />

            {/* Challenge */}
            <PKCEValueCard
              label="code_challenge"
              sublabel="BASE64URL(SHA256(code_verifier)) — sent in the authorization request"
              value={values.challenge}
              copyKey="challenge"
              copied={copied}
              onCopy={handleCopy}
              colorClass="border-l-green-400"
              badgeClass="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            />

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>How to use</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                <p className="text-sm font-medium">Include code_challenge in the authorization URL</p>
              </div>
              <div className="relative rounded-lg border bg-zinc-950 p-3 overflow-x-auto">
                <button
                  onClick={() => handleCopy("auth-url", authUrl)}
                  className="absolute top-2 right-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {copied === "auth-url" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{authUrl}</pre>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                <ArrowRight className="w-4 h-4 rotate-90" />
                <span>User authenticates and grants consent</span>
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                <p className="text-sm font-medium">Include code_verifier in the token request</p>
              </div>
              <div className="relative rounded-lg border bg-zinc-950 p-3 overflow-x-auto">
                <button
                  onClick={() => handleCopy("token-req", tokenRequest)}
                  className="absolute top-2 right-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {copied === "token-req" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{tokenRequest}</pre>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Properties</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>The code_verifier is generated fresh for each authorization attempt and never sent to the authorization server until the token exchange.</p>
                <p>SHA256 is a one-way function — an attacker who intercepts code_challenge cannot reverse it to obtain code_verifier. This prevents PKCE downgrade attacks.</p>
                <p>The authorization server verifies: <code className="bg-muted px-1 rounded">BASE64URL(SHA256(code_verifier)) == code_challenge</code> before issuing tokens.</p>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {!values && (
        <div className="text-center py-8 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Click "Generate PKCE Values" to create a fresh code_verifier and code_challenge pair.</p>
        </div>
      )}
    </div>
  );
}

function PKCEValueCard({
  label,
  sublabel,
  value,
  copyKey,
  copied,
  onCopy,
  colorClass,
  badgeClass,
}: {
  label: string;
  sublabel: string;
  value: string;
  copyKey: string;
  copied: string | null;
  onCopy: (key: string, value: string) => void;
  colorClass: string;
  badgeClass: string;
}) {
  return (
    <div className={cn("rounded-lg border-l-4 border border-border p-4 space-y-2", colorClass)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded font-mono", badgeClass)}>{label}</span>
          <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
        </div>
        <button
          onClick={() => onCopy(copyKey, value)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {copied === copyKey
            ? <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Copied</span></>
            : <><Copy className="w-3 h-3" /><span>Copy</span></>
          }
        </button>
      </div>
      <p className="font-mono text-xs text-muted-foreground break-all bg-muted/50 rounded p-2">{value}</p>
      <p className="text-xs text-muted-foreground">
        Length: {value.length} characters
        {label === "code_verifier" && " (min 43, max 128 per RFC 7636)"}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Playground Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PlaygroundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <ScrollReveal>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Playground</span>
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal delay={0.05}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Playground</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Interactive tools for working with OAuth and JWTs. Decode and analyze tokens, find the right
            grant type for your application, and generate PKCE values for your authorization requests.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Tabs defaultValue="inspector" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="inspector" className="gap-1.5 text-xs sm:text-sm">
              <Key className="w-3.5 h-3.5 shrink-0" />
              <span>Token Inspector</span>
            </TabsTrigger>
            <TabsTrigger value="wizard" className="gap-1.5 text-xs sm:text-sm">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Grant Type Wizard</span>
            </TabsTrigger>
            <TabsTrigger value="pkce" className="gap-1.5 text-xs sm:text-sm">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>PKCE Generator</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspector" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">JWT Token Inspector</CardTitle>
                  <Badge variant="secondary" className="text-xs">Client-side only</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Decode any JWT to inspect its header, payload, and structure. Security warnings highlight
                  common misconfiguration patterns. Token never leaves your browser.
                </p>
              </CardHeader>
              <CardContent>
                <TokenInspector />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wizard" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Grant Type Decision Tree</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Answer a few questions about your application and get a specific OAuth grant type recommendation
                  with implementation guidance.
                </p>
              </CardHeader>
              <CardContent>
                <GrantTypeWizard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pkce" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">PKCE Generator</CardTitle>
                  <Badge variant="secondary" className="text-xs">Uses Web Crypto API</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate cryptographically secure PKCE values for testing and development.
                  Values are generated locally using the browser's Web Crypto API.
                </p>
              </CardHeader>
              <CardContent>
                <PKCEGenerator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollReveal>

      {/* Footer */}
      <ScrollReveal delay={0.2}>
        <div className="mt-10 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            All tools run entirely in your browser — no tokens or keys are transmitted to any server.
            For production use, always verify JWT signatures server-side using your AS's JWKS endpoint.
            See the{" "}
            <Link href="/checklist" className="text-primary underline underline-offset-2 hover:no-underline">
              Security Checklist
            </Link>
            {" "}for production requirements.
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}

// Aliased import for Lock icon used in tab trigger
function Lock(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
