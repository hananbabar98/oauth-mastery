"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  AlertTriangle,
  RefreshCw,
  Lock,
  GitMerge,
  ClipboardList,
  Square,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal, StaggerReveal } from "@/components/layout/scroll-reveal";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  year: string;
  label: string;
  description: string;
  rfc?: string;
  current?: boolean;
}

const timeline: TimelineEvent[] = [
  {
    year: "2012",
    label: "OAuth 2.0",
    description: "RFC 6749 published. Extensible framework with multiple grant types. Left many security decisions to implementers.",
    rfc: "RFC 6749",
  },
  {
    year: "2017",
    label: "RFC 8252",
    description: "OAuth 2.0 for Native Apps. Prohibited embedded web views, required PKCE for mobile, introduced custom URI schemes.",
    rfc: "RFC 8252",
  },
  {
    year: "2015",
    label: "RFC 7636",
    description: "PKCE (Proof Key for Code Exchange). Cryptographic protection for authorization code flows. Initially for mobile, now universal.",
    rfc: "RFC 7636",
  },
  {
    year: "2021",
    label: "RFC 9068",
    description: "JSON Web Token Profile for OAuth 2.0 Access Tokens. Standardized claims and format for JWT access tokens.",
    rfc: "RFC 9068",
  },
  {
    year: "2023+",
    label: "OAuth 2.1",
    description: "Consolidation draft. Incorporates PKCE, removes Implicit and ROPC, mandates exact URI matching, formalizes best practices.",
    current: true,
  },
];

const pkceBeforeCode = `// OAuth 2.0 — PKCE was optional for web apps
// Authorization Server allowed code exchange without verifier

POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE
&client_id=web-app
&client_secret=my-secret  // Client secret used instead of PKCE
// No code_verifier — PKCE not required`;

const pkceAfterCode = `// OAuth 2.1 — PKCE mandatory for ALL authorization code flows
// Client always sends code_challenge in authorization request

// Step 1: Generate PKCE values
const verifier = generateCodeVerifier(); // 32+ random bytes, base64url
const challenge = await sha256(verifier); // base64url(SHA256(verifier))

// Step 2: Authorization request MUST include code_challenge
const authURL = new URL("https://auth.example.com/authorize");
authURL.searchParams.set("response_type", "code");
authURL.searchParams.set("client_id", "my-app");
authURL.searchParams.set("code_challenge", challenge);
authURL.searchParams.set("code_challenge_method", "S256"); // S256 required
authURL.searchParams.set("redirect_uri", REDIRECT_URI);
authURL.searchParams.set("scope", "openid profile");
authURL.searchParams.set("state", generateState());

// Step 3: Token exchange MUST include code_verifier
const tokenResponse = await fetch("/oauth/token", {
  method: "POST",
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: authorizationCode,
    code_verifier: verifier, // ← AS verifies SHA256(verifier) == challenge
    client_id: "my-app",
    redirect_uri: REDIRECT_URI,
    // No client_secret needed for public clients using PKCE
  }),
});`;

const uriMatchingCode = `// ❌ OAuth 2.0 — wildcard and prefix matching was common
// Allowed registering: https://app.example.com/*
// Which permitted: https://app.example.com/callback/../steal
//                  https://app.example.com/callback%2f..%2fsteal (encoded)

// ✅ OAuth 2.1 — exact string matching required
// Registration: https://app.example.com/auth/callback
// Request:      https://app.example.com/auth/callback   ← EXACT match only

// Compliant AS implementation:
function validateRedirectUri(registered: string[], provided: string): boolean {
  // Normalize both URIs to prevent encoding bypass
  const normalize = (uri: string) => decodeURIComponent(uri).toLowerCase();

  // Exact comparison — no wildcards, no prefix matching
  return registered.some(r => normalize(r) === normalize(provided));
}

// Migration: Register each redirect URI exactly as your client sends it
// Dev:     http://localhost:3000/callback
// Staging: https://staging.myapp.com/callback
// Prod:    https://myapp.com/callback`;

const refreshRotationCode = `// OAuth 2.1: One-time-use refresh tokens for public clients
// Each use returns a NEW refresh token — old one is immediately revoked

// Token endpoint response:
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "NEW_REFRESH_TOKEN_abcd1234",  // ← New token on every use!
  "scope": "openid profile"
}

// Client MUST:
// 1. Store the new refresh token immediately
// 2. Discard the old refresh token
// 3. Handle invalid_grant gracefully (token was already used or stolen)

async function refresh(storedRefreshToken: string): Promise<TokenSet> {
  const response = await fetch("/oauth/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: storedRefreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.error === "invalid_grant") {
      // Possible causes:
      // 1. Token expired (expected)
      // 2. Token already used (concurrent refresh)
      // 3. AS detected reuse pattern → revoked all tokens (theft detection!)
      clearAllTokens(); // Force re-authentication
      redirectToLogin();
    }
    throw new Error(error.error);
  }

  const tokens = await response.json();
  // CRITICAL: replace old refresh token with new one
  await secureStorage.set("refresh_token", tokens.refresh_token);
  return tokens;
}`;

interface MigrationItem {
  id: string;
  text: string;
  details: string;
  severity: "required" | "recommended";
}

const migrationChecklist: { section: string; items: MigrationItem[] }[] = [
  {
    section: "Remove Deprecated Grant Types",
    items: [
      {
        id: "remove-implicit",
        text: "Remove Implicit flow usage",
        details: "Replace with Authorization Code + PKCE. Remove response_type=token from any client configurations.",
        severity: "required",
      },
      {
        id: "remove-ropc",
        text: "Remove Resource Owner Password Credentials (ROPC)",
        details: "Migrate to Device Authorization flow for CLIs/scripts, or Authorization Code + PKCE for user-facing apps.",
        severity: "required",
      },
    ],
  },
  {
    section: "Enforce PKCE",
    items: [
      {
        id: "pkce-clients",
        text: "All clients send code_challenge with S256 method",
        details: "Update every client to generate a code_verifier and include code_challenge=S256(...) in authorization requests.",
        severity: "required",
      },
      {
        id: "pkce-as",
        text: "Authorization Server rejects code exchanges without code_verifier",
        details: "AS must require PKCE for all authorization code flows and reject 'plain' method.",
        severity: "required",
      },
    ],
  },
  {
    section: "Redirect URI Security",
    items: [
      {
        id: "exact-matching",
        text: "Implement exact string matching for redirect URIs",
        details: "Remove any wildcard, prefix, or pattern matching. Each URI must match exactly.",
        severity: "required",
      },
      {
        id: "register-all-uris",
        text: "Register all redirect URIs explicitly (dev, staging, prod)",
        details: "No dynamic URI construction. Every environment's exact URI must be pre-registered.",
        severity: "required",
      },
    ],
  },
  {
    section: "State & CSRF",
    items: [
      {
        id: "state-required",
        text: "Generate cryptographically random state for every authorization request",
        details: "Use crypto.randomBytes(32) or equivalent. Store in httpOnly session cookie. Validate on every callback.",
        severity: "required",
      },
      {
        id: "state-validate",
        text: "Reject callbacks with missing or mismatched state",
        details: "Use timing-safe comparison. Delete state from session immediately after validation (one-time use).",
        severity: "required",
      },
    ],
  },
  {
    section: "Refresh Token Rotation",
    items: [
      {
        id: "rotation-enabled",
        text: "Enable refresh token rotation on the Authorization Server",
        details: "Every refresh token use must return a new refresh token and invalidate the old one.",
        severity: "required",
      },
      {
        id: "rotation-handle",
        text: "Clients store new refresh token on every use",
        details: "Update storage immediately. Handle invalid_grant by clearing all tokens and re-authenticating.",
        severity: "required",
      },
      {
        id: "theft-detection",
        text: "AS revokes token family on refresh token reuse detection",
        details: "If a refresh token is used twice, treat it as stolen. Revoke all tokens for that user/session.",
        severity: "recommended",
      },
    ],
  },
  {
    section: "Client Secrets",
    items: [
      {
        id: "public-clients",
        text: "Public clients do not use client secrets",
        details: "Browser apps, mobile apps, and CLIs are public clients. Remove any client_secret from these environments.",
        severity: "required",
      },
      {
        id: "confidential-clients",
        text: "Confidential clients authenticate with client_secret or private_key_jwt",
        details: "Server-side apps should use client_secret_post or client_secret_basic. Consider private_key_jwt for higher assurance.",
        severity: "recommended",
      },
    ],
  },
];

interface ChangeCard {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  status: "removed" | "required" | "changed";
  before: string;
  after: string;
  impact: string;
  codeExample?: { code: string; language: string; filename: string };
}

const changes: ChangeCard[] = [
  {
    icon: <Shield className="w-5 h-5" />,
    iconBg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    title: "PKCE Required for Authorization Code Flow",
    status: "required",
    before: "PKCE was optional, defined in a separate RFC (7636). Most web apps using client_secret skipped it entirely.",
    after: "PKCE is mandatory for all authorization code flows, for all client types — including confidential clients.",
    impact: "Eliminates authorization code interception attacks. Public clients no longer need client_secret for security.",
    codeExample: { code: pkceAfterCode, language: "typescript", filename: "pkce-required.ts" },
  },
  {
    icon: <Lock className="w-5 h-5" />,
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    title: "Redirect URI Exact Matching",
    status: "required",
    before: "Substring matching, wildcard patterns (*.example.com), and prefix matching were common AS implementations.",
    after: "OAuth 2.1 requires exact string comparison. No wildcards, no patterns. Every URI must be registered exactly.",
    impact: "Eliminates open redirect vulnerabilities and covert redirect attacks based on URI manipulation.",
    codeExample: { code: uriMatchingCode, language: "typescript", filename: "exact-matching.ts" },
  },
  {
    icon: <Shield className="w-5 h-5" />,
    iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    title: "State Parameter Enforcement",
    status: "required",
    before: "State was 'RECOMMENDED' in OAuth 2.0 (RFC 6749 §10.12). Many implementations omitted it or used non-random values.",
    after: "OAuth 2.1 formally prohibits CSRF-vulnerable implementations. State validation is required behavior, not a suggestion.",
    impact: "Closes the gap between spec recommendation and implementation reality. Prevents account takeover via CSRF.",
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    iconBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    title: "Refresh Token Rotation",
    status: "required",
    before: "Long-lived, reusable refresh tokens were common. A stolen token could be used indefinitely.",
    after: "Public clients must use one-time-use refresh tokens. Sender-constrained tokens (DPoP, mTLS) preferred for confidential clients.",
    impact: "Stolen refresh tokens have a very short window of usability. Reuse detection enables automatic compromise response.",
    codeExample: { code: refreshRotationCode, language: "typescript", filename: "refresh-rotation.ts" },
  },
  {
    icon: <XCircle className="w-5 h-5" />,
    iconBg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    title: "Implicit Flow Removed",
    status: "removed",
    before: "Implicit flow (response_type=token) returned access tokens directly in the URL fragment, bypassing the authorization code exchange.",
    after: "Implicit flow is entirely removed from OAuth 2.1. All browser-based apps must use Authorization Code + PKCE.",
    impact: "Eliminates token leakage via URL fragments, browser history, and Referrer headers. All existing Implicit clients must migrate.",
  },
  {
    icon: <XCircle className="w-5 h-5" />,
    iconBg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    title: "Resource Owner Password Credentials Removed",
    status: "removed",
    before: "ROPC (grant_type=password) allowed clients to collect usernames and passwords directly, passing them to the AS.",
    after: "ROPC is removed. No client should ever handle user credentials directly. Use Device flow or Auth Code + PKCE instead.",
    impact: "Prevents clients from phishing credentials. Enforces the OAuth principle that credentials belong only to the AS.",
  },
];

const statusConfig = {
  removed: { label: "Removed", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  required: { label: "Now Required", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  changed: { label: "Changed", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

export default function OAuth21Page() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const allItems = migrationChecklist.flatMap((s) => s.items);
  const totalRequired = allItems.filter((i) => i.severity === "required").length;
  const checkedRequired = allItems.filter((i) => i.severity === "required" && checkedItems.has(i.id)).length;
  const progress = totalRequired > 0 ? Math.round((checkedRequired / totalRequired) * 100) : 0;

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <ScrollReveal>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">OAuth 2.1</span>
        </div>
      </ScrollReveal>

      {/* Hero */}
      <ScrollReveal delay={0.05}>
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">OAuth 2.1</h1>
              <Badge variant="warning">Draft Specification</Badge>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            OAuth 2.1 consolidates OAuth 2.0 best practices accumulated over a decade into a single, coherent specification.
            It removes deprecated grant types, mandates proven security mechanisms, and closes the gap between what the spec
            recommends and what implementations must enforce.
          </p>
        </div>
      </ScrollReveal>

      {/* Timeline */}
      <ScrollReveal delay={0.1}>
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">The Road to OAuth 2.1</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-border hidden sm:block" />

            <div className="space-y-6">
              {timeline.map((event, i) => (
                <motion.div
                  key={event.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex gap-4 sm:gap-6 items-start"
                >
                  <div className="flex flex-col items-end shrink-0 w-20 sm:w-24">
                    <span className="text-xs font-mono text-muted-foreground">{event.year}</span>
                    {event.rfc && (
                      <span className="text-xs text-primary font-medium mt-0.5">{event.rfc}</span>
                    )}
                  </div>
                  <div className={cn(
                    "relative flex items-center justify-center w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 z-10",
                    event.current
                      ? "border-primary bg-primary"
                      : "border-muted-foreground bg-background"
                  )}>
                    {event.current && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                  </div>
                  <div className="pb-2">
                    <p className={cn("font-semibold text-sm", event.current && "text-primary")}>{event.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <Separator className="mb-12" />

      {/* Changes */}
      <ScrollReveal>
        <h2 className="text-2xl font-bold mb-2">What Changed</h2>
        <p className="text-muted-foreground mb-8">
          Six concrete changes that distinguish OAuth 2.1 from OAuth 2.0. Two grant types are removed; four security
          mechanisms are now mandatory rather than optional.
        </p>
      </ScrollReveal>

      <div className="space-y-8">
        {changes.map((change, i) => (
          <ScrollReveal key={change.title} delay={i * 0.05}>
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", change.iconBg)}>
                    {change.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="text-base leading-tight">{change.title}</CardTitle>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded font-medium",
                        statusConfig[change.status].className
                      )}>
                        {statusConfig[change.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">Before (OAuth 2.0)</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{change.before}</p>
                  </div>
                  <div className="rounded-md border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">After (OAuth 2.1)</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{change.after}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed"><strong className="text-foreground">Impact:</strong> {change.impact}</p>
                </div>

                {change.codeExample && (
                  <CodeBlock
                    code={change.codeExample.code}
                    language={change.codeExample.language}
                    filename={change.codeExample.filename}
                  />
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <Separator className="my-12" />

      {/* Migration Checklist */}
      <ScrollReveal>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold">Migration Checklist</h2>
          </div>
          <p className="text-muted-foreground">
            Use this checklist to audit your existing OAuth 2.0 implementation for 2.1 compliance.
            Track your progress as you work through each requirement.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.05}>
        <div className="mb-6 p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Required items completed</span>
            <span className="text-sm font-mono font-semibold text-primary">{checkedRequired}/{totalRequired}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {progress === 100 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All required items complete — your implementation is OAuth 2.1 ready!
            </p>
          )}
        </div>
      </ScrollReveal>

      <div className="space-y-6">
        {migrationChecklist.map((section, si) => (
          <ScrollReveal key={section.section} delay={si * 0.05}>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.section}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const isChecked = checkedItems.has(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition-colors duration-150",
                        isChecked
                          ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isChecked
                            ? <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                            : <Square className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className={cn(
                              "text-sm font-medium",
                              isChecked && "line-through text-muted-foreground"
                            )}>
                              {item.text}
                            </span>
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded font-medium",
                              item.severity === "required"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                              {item.severity === "required" ? "Required" : "Recommended"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.details}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.2}>
        <Alert className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Draft Status</AlertTitle>
          <AlertDescription>
            OAuth 2.1 is currently a draft specification (draft-ietf-oauth-v2-1). The changes described here reflect
            the latest draft and established best practices. Major authorization servers (Auth0, Okta, Keycloak, AWS Cognito)
            already implement these requirements. You should apply them regardless of final ratification.
          </AlertDescription>
        </Alert>
      </ScrollReveal>

      {/* Footer links */}
      <ScrollReveal delay={0.25}>
        <div className="mt-10 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            See the{" "}
            <Link href="/edge-cases" className="text-primary underline underline-offset-2 hover:no-underline">
              Edge Case Library
            </Link>
            {" "}for attacks that these changes prevent, and the{" "}
            <Link href="/checklist" className="text-primary underline underline-offset-2 hover:no-underline">
              Security Checklist
            </Link>
            {" "}for a full production readiness audit.
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
