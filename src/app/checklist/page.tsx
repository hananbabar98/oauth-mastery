"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  CheckSquare,
  Square,
  Download,
  RotateCcw,
  Shield,
  Code2,
  Key,
  Globe,
  Rocket,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  text: string;
  details: string;
  priority: "critical" | "high" | "medium";
  link?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  items: ChecklistItem[];
}

const STORAGE_KEY = "oauth-checklist-state";

const sections: ChecklistSection[] = [
  {
    id: "authorization-server",
    title: "Authorization Server Config",
    icon: <Shield className="w-4 h-4" />,
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    description: "Configuration requirements for the OAuth authorization server.",
    items: [
      {
        id: "as-pkce-required",
        text: "PKCE enforced for all authorization code flows",
        details: "The AS must reject authorization code exchanges that do not include a code_verifier matching the code_challenge from the authorization request. The 'plain' method must be rejected — only S256 accepted.",
        priority: "critical",
        link: "/edge-cases#pkce-downgrade",
      },
      {
        id: "as-exact-uri",
        text: "Redirect URIs use exact string matching (no wildcards)",
        details: "The AS must compare redirect_uri against the registered list using exact string comparison. Wildcard patterns (*.example.com), prefix matching, and path traversal (/../) must all be rejected.",
        priority: "critical",
        link: "/edge-cases#redirect-uri",
      },
      {
        id: "as-state-required",
        text: "State parameter required and validated",
        details: "State should be required for all flows involving browser redirects. The AS must pass it through unmodified so clients can validate it. Document the state validation requirement for client developers.",
        priority: "critical",
        link: "/edge-cases#csrf",
      },
      {
        id: "as-token-lifetimes",
        text: "Token lifetimes appropriate (access ≤ 1 hr, refresh ≤ 30 days for public clients)",
        details: "Access tokens should be short-lived (5–60 minutes). Refresh tokens for public clients should be limited to 30 days. Longer lifetimes increase the window of opportunity for stolen tokens.",
        priority: "high",
      },
      {
        id: "as-revocation",
        text: "Token revocation endpoint implemented (RFC 7009)",
        details: "Implement POST /oauth/revoke accepting token and token_type_hint. Revoking a refresh token must also invalidate all associated access tokens. Required for logout flows.",
        priority: "high",
      },
      {
        id: "as-introspection",
        text: "Token introspection endpoint secured",
        details: "The introspection endpoint (RFC 7662) must authenticate callers. Only trusted resource servers should be able to call it. Never expose to public clients directly.",
        priority: "high",
      },
      {
        id: "as-rate-limiting",
        text: "Rate limiting on token endpoint",
        details: "Apply rate limiting per client_id and per IP on /oauth/token. Implement exponential backoff responses (429 with Retry-After). Prevents brute-force attacks on client secrets and authorization codes.",
        priority: "high",
      },
      {
        id: "as-refresh-rotation",
        text: "Refresh token rotation enabled",
        details: "Issue a new refresh token on every use and immediately revoke the old one. Detect reuse (same refresh token used twice) as a sign of theft and revoke the entire token family for the user.",
        priority: "critical",
        link: "/oauth-21#refresh-rotation",
      },
    ],
  },
  {
    id: "client-implementation",
    title: "Client Implementation",
    icon: <Code2 className="w-4 h-4" />,
    iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    description: "Requirements for OAuth client application code.",
    items: [
      {
        id: "cl-auth-code-pkce",
        text: "Using Authorization Code + PKCE (not Implicit or ROPC)",
        details: "All flows should use authorization_code grant with PKCE. Implicit flow (response_type=token) and Resource Owner Password Credentials are deprecated in OAuth 2.1 and must not be used in new implementations.",
        priority: "critical",
        link: "/oauth-21",
      },
      {
        id: "cl-no-secret-exposure",
        text: "Client secret not exposed in browser or mobile code",
        details: "Public clients (SPAs, mobile apps, CLIs) must not have client_secret in source code, build artifacts, or app bundles. Use PKCE instead. Confidential client secrets belong only on the server side.",
        priority: "critical",
      },
      {
        id: "cl-state-crypto",
        text: "State parameter generated with cryptographically random values",
        details: "Use crypto.randomBytes(32) or crypto.getRandomValues(). Do not use Math.random(), sequential IDs, or predictable values. The state must be at least 16 bytes of random data.",
        priority: "critical",
        link: "/edge-cases#csrf",
      },
      {
        id: "cl-state-validate",
        text: "State parameter validated on every callback",
        details: "Before exchanging the authorization code, verify the state from the callback exactly matches what was stored in the session. Use timing-safe comparison. Delete state from session immediately after validation.",
        priority: "critical",
        link: "/edge-cases#csrf",
      },
      {
        id: "cl-redirect-exact",
        text: "Redirect URI registered exactly as used",
        details: "The redirect_uri in the authorization request must exactly match a registered URI. Do not build redirect URIs dynamically. Register each environment (dev, staging, prod) separately.",
        priority: "high",
      },
      {
        id: "cl-least-privilege",
        text: "Scope follows principle of least privilege",
        details: "Request only the scopes required for the current operation. Use incremental authorization to request additional scopes only when needed. Validate that the granted scope matches what was requested.",
        priority: "high",
      },
      {
        id: "cl-pkce-s256",
        text: "PKCE using S256 method (not plain)",
        details: "Always use code_challenge_method=S256. The 'plain' method provides no real security — if an attacker intercepts the authorization request, they already have the verifier. S256 uses SHA256 as a one-way function.",
        priority: "critical",
        link: "/edge-cases#pkce-downgrade",
      },
      {
        id: "cl-code-once",
        text: "Authorization code used only once",
        details: "Authorization codes are one-time-use. Immediately exchange and delete after use. If your callback receives a code that has already been used, treat it as a potential replay attack and reject the request.",
        priority: "high",
      },
    ],
  },
  {
    id: "token-handling",
    title: "Token Handling",
    icon: <Key className="w-4 h-4" />,
    iconBg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    description: "Secure storage, validation, and lifecycle management of OAuth tokens.",
    items: [
      {
        id: "th-validate-every-request",
        text: "Access tokens validated on every request (signature, expiry, aud, iss)",
        details: "The resource server must verify: JWT signature (using JWKS), exp claim (not expired), iss claim (expected issuer), aud claim (token intended for this service). Never skip validation — do not just decode and trust.",
        priority: "critical",
      },
      {
        id: "th-refresh-secure-storage",
        text: "Refresh tokens stored securely (not localStorage for web apps)",
        details: "Web apps: use httpOnly, Secure, SameSite=Strict cookies or BFF pattern. Mobile: use iOS Keychain or Android Keystore. Never store refresh tokens in localStorage, sessionStorage, or non-sandboxed storage.",
        priority: "critical",
        link: "/edge-cases#token-leakage",
      },
      {
        id: "th-expiry-refresh",
        text: "Token expiry handled gracefully with automatic refresh",
        details: "Implement proactive refresh (60 seconds before expiry) to avoid failed user requests. Handle 401 responses by refreshing and retrying once. Show appropriate UX if refresh fails (session expired).",
        priority: "high",
      },
      {
        id: "th-concurrent-mutex",
        text: "Concurrent refresh handled with mutex or distributed lock",
        details: "Use a promise-based mutex (single process) or Redis-based distributed lock (multi-server) to ensure only one refresh attempt occurs simultaneously. Other requests wait for the in-flight refresh to complete.",
        priority: "high",
        link: "/edge-cases#concurrent-refresh",
      },
      {
        id: "th-revoke-logout",
        text: "Tokens revoked on logout",
        details: "On logout, call the revocation endpoint (RFC 7009) for both access token and refresh token. Clear all tokens from client storage. Do not just delete local storage — the tokens remain valid on the server otherwise.",
        priority: "high",
      },
      {
        id: "th-no-logging",
        text: "Tokens not logged in plaintext",
        details: "Ensure application logs, APM tools, error tracking (Sentry), and debug output do not capture token values. Scrub Authorization headers from access logs. Implement log filtering middleware.",
        priority: "critical",
        link: "/edge-cases#token-leakage",
      },
      {
        id: "th-no-url-tokens",
        text: "Tokens not transmitted in URL query parameters",
        details: "Never pass tokens as query parameters (?access_token=...). They leak via Referrer headers, browser history, server logs, and CDN caches. Always use the Authorization: Bearer header.",
        priority: "critical",
        link: "/edge-cases#token-leakage",
      },
    ],
  },
  {
    id: "api-security",
    title: "API Security (Resource Server)",
    icon: <Globe className="w-4 h-4" />,
    iconBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    description: "Token validation and authorization enforcement at the resource server / API layer.",
    items: [
      {
        id: "rs-signature-verify",
        text: "JWT signature verified cryptographically (not just decoded)",
        details: "Fetch the JWKS from the AS discovery endpoint. Match the kid in the JWT header to the correct public key. Verify the signature. Never accept unsigned JWTs (alg: none) or use symmetric secrets incorrectly.",
        priority: "critical",
        link: "/playground",
      },
      {
        id: "rs-exp-checked",
        text: "Expiry (exp) claim checked on every request",
        details: "Compare exp (Unix timestamp) against current time. Allow a small clock skew tolerance (≤60 seconds). Reject any token where exp is in the past. Never cache validation results beyond the token's exp.",
        priority: "critical",
      },
      {
        id: "rs-iss-validated",
        text: "Issuer (iss) claim validated against expected value",
        details: "Hardcode the expected issuer URL in your configuration. Reject tokens from any other issuer. This prevents tokens issued by one service from being accepted by another (confused deputy attacks).",
        priority: "critical",
      },
      {
        id: "rs-aud-validated",
        text: "Audience (aud) claim validated",
        details: "Your API's identifier must appear in the aud claim. Reject tokens where aud does not include your API. Without this check, a token issued for another service could be replayed against yours.",
        priority: "critical",
      },
      {
        id: "rs-scope-checked",
        text: "Scope/permissions checked per endpoint",
        details: "Each API endpoint must verify the token contains the required scope or permission. A token with scope=read:profile must not access write:data endpoints. Implement per-route middleware or policy checks.",
        priority: "critical",
      },
      {
        id: "rs-https-only",
        text: "Bearer tokens only accepted over HTTPS",
        details: "HTTP connections must be redirected to HTTPS before any token is transmitted. Use HSTS to enforce this at the browser level. Configure the load balancer/proxy to reject plain HTTP with 301.",
        priority: "critical",
      },
      {
        id: "rs-jwks-cached",
        text: "JWKS endpoint cached with appropriate TTL",
        details: "Cache the JWKS response (typically 1-24 hours per the Cache-Control header). Do not fetch JWKS on every request — it adds latency and can overwhelm the AS. Implement cache invalidation when kid is not found.",
        priority: "high",
      },
    ],
  },
  {
    id: "production-readiness",
    title: "Production Readiness",
    icon: <Rocket className="w-4 h-4" />,
    iconBg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    description: "Operational, monitoring, and incident response requirements for production OAuth deployments.",
    items: [
      {
        id: "pr-https-everywhere",
        text: "HTTPS enforced everywhere (including redirects and callbacks)",
        details: "All OAuth endpoints, callback URLs, and API endpoints must use HTTPS. No HTTP anywhere in the flow. Configure HSTS with includeSubDomains and preload. Verify TLS certificate validity and chain.",
        priority: "critical",
      },
      {
        id: "pr-auth-monitoring",
        text: "Monitoring for auth failures and anomalies",
        details: "Alert on: spike in 401/403 responses, unusual token endpoint error rates, failed state validations, refresh token reuse events. Use structured logging to make OAuth events queryable.",
        priority: "high",
      },
      {
        id: "pr-refresh-alerts",
        text: "Token refresh failure alerting configured",
        details: "Alert when refresh token failure rate exceeds threshold (e.g., > 5% of refreshes fail). invalid_grant errors at scale may indicate token theft or a deployment issue with token storage.",
        priority: "high",
      },
      {
        id: "pr-incident-response",
        text: "Incident response: token revocation procedure documented",
        details: "Document and test the procedure for: revoking all tokens for a compromised user, rotating client secrets, invalidating all sessions (kill switch). Test the procedure before an incident occurs.",
        priority: "high",
      },
      {
        id: "pr-secret-rotation",
        text: "Regular rotation of client secrets",
        details: "Rotate client secrets at least annually, or immediately when a secret may be compromised. Use zero-downtime rotation: add new secret, update all consumers, remove old secret. Document the process.",
        priority: "medium",
      },
      {
        id: "pr-security-headers",
        text: "Security headers set (HSTS, CSP, X-Frame-Options, etc.)",
        details: "Strict-Transport-Security: max-age=31536000; includeSubDomains. Content-Security-Policy preventing XSS that could steal tokens. X-Frame-Options: DENY to prevent clickjacking on auth pages.",
        priority: "high",
      },
      {
        id: "pr-dep-scanning",
        text: "Dependency scanning for auth library vulnerabilities",
        details: "Run npm audit / snyk / dependabot on all projects using OAuth/JWT libraries. Subscribe to CVE notifications for: passport, jsonwebtoken, python-jose, django-oauth-toolkit, spring-security-oauth.",
        priority: "high",
      },
    ],
  },
];

const priorityConfig = {
  critical: { label: "Critical", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setChecked(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
    } catch {
      // ignore storage errors
    }
  }, [checked, loaded]);

  const toggleItem = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSection = useCallback((section: ChecklistSection) => {
    const allChecked = section.items.every((i) => checked.has(i.id));
    setChecked((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        section.items.forEach((i) => next.delete(i.id));
      } else {
        section.items.forEach((i) => next.add(i.id));
      }
      return next;
    });
  }, [checked]);

  const reset = () => {
    setChecked(new Set());
  };

  const allItems = sections.flatMap((s) => s.items);
  const totalItems = allItems.length;
  const checkedCount = allItems.filter((i) => checked.has(i.id)).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const criticalItems = allItems.filter((i) => i.priority === "critical");
  const criticalChecked = criticalItems.filter((i) => checked.has(i.id)).length;
  const allCriticalDone = criticalChecked === criticalItems.length;

  const exportMarkdown = () => {
    const lines: string[] = [
      "# OAuth Security & Integration Checklist",
      "",
      `Generated: ${new Date().toLocaleDateString()}`,
      `Progress: ${checkedCount}/${totalItems} items complete (${progress}%)`,
      "",
    ];

    for (const section of sections) {
      lines.push(`## ${section.title}`);
      lines.push("");
      for (const item of section.items) {
        const checkMark = checked.has(item.id) ? "x" : " ";
        lines.push(`- [${checkMark}] **[${item.priority.toUpperCase()}]** ${item.text}`);
        lines.push(`  > ${item.details}`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("Generated by [OAuth Mastery](https://github.com/your-repo/oauth-mastery)");

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "oauth-security-checklist.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <ScrollReveal>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Security Checklist</span>
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal delay={0.05}>
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            OAuth Security Checklist
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A production-ready audit checklist covering authorization server configuration, client implementation,
            token handling, API security, and operational readiness. Check items as you complete them — progress
            is saved automatically.
          </p>
        </div>
      </ScrollReveal>

      {/* Progress Dashboard */}
      <ScrollReveal delay={0.1}>
        <div className="mb-8 rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">Overall Progress</h2>
                {allCriticalDone && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    All Critical Items Done
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {checkedCount} of {totalItems} items completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportMarkdown} className="gap-1.5">
                <Download className="w-4 h-4" />
                Export Markdown
              </Button>
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-mono font-semibold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Per-section mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {sections.map((section) => {
              const sectionChecked = section.items.filter((i) => checked.has(i.id)).length;
              const sectionTotal = section.items.length;
              const sectionPct = Math.round((sectionChecked / sectionTotal) * 100);
              return (
                <div key={section.id} className="text-center">
                  <div className={cn(
                    "w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center text-xs",
                    section.iconBg
                  )}>
                    {section.icon}
                  </div>
                  <div className="text-xs font-mono font-semibold">{sectionPct}%</div>
                  <div className="text-xs text-muted-foreground leading-tight">{sectionChecked}/{sectionTotal}</div>
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {progress === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                  <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-700 dark:text-green-400">Checklist Complete!</AlertTitle>
                  <AlertDescription className="text-green-600/80 dark:text-green-500">
                    Your OAuth implementation meets all the items on this checklist. Consider a periodic review
                    (quarterly) and keep your dependencies updated.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollReveal>

      {/* Critical items summary */}
      {!allCriticalDone && loaded && (
        <ScrollReveal delay={0.12}>
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>
              {criticalItems.length - criticalChecked} critical item{criticalItems.length - criticalChecked !== 1 ? "s" : ""} remaining
            </AlertTitle>
            <AlertDescription>
              Complete all critical priority items before considering your implementation production-ready.
              Critical items represent known attack vectors with documented exploits.
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, si) => {
          const sectionChecked = section.items.filter((i) => checked.has(i.id)).length;
          const allChecked = sectionChecked === section.items.length;

          return (
            <ScrollReveal key={section.id} delay={si * 0.05}>
              <div>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex items-center justify-center w-7 h-7 rounded-md shrink-0", section.iconBg)}>
                      {section.icon}
                    </div>
                    <h2 className="text-lg font-bold">{section.title}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({sectionChecked}/{section.items.length})
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSection(section)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    {allChecked ? "Uncheck all" : "Check all"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{section.description}</p>

                {/* Items */}
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const isChecked = checked.has(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        className={cn(
                          "group rounded-lg border transition-colors duration-150 overflow-hidden",
                          isChecked
                            ? "border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/20"
                            : "border-border bg-card hover:border-primary/30"
                        )}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full text-left p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">
                              <AnimatePresence mode="wait" initial={false}>
                                {isChecked ? (
                                  <motion.div
                                    key="checked"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="unchecked"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <Square className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 flex-wrap mb-1">
                                <span className={cn(
                                  "text-sm font-medium leading-tight",
                                  isChecked && "line-through text-muted-foreground"
                                )}>
                                  {item.text}
                                </span>
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded font-medium shrink-0",
                                  priorityConfig[item.priority].className
                                )}>
                                  {priorityConfig[item.priority].label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.details}
                              </p>
                              {item.link && (
                                <Link
                                  href={item.link}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline underline-offset-2"
                                >
                                  Learn more
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              {si < sections.length - 1 && <Separator className="mt-8" />}
            </ScrollReveal>
          );
        })}
      </div>

      {/* Footer */}
      <ScrollReveal delay={0.2}>
        <div className="mt-10 pt-8 border-t">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <p className="text-sm text-muted-foreground">
              For attack details behind each item, see the{" "}
              <Link href="/edge-cases" className="text-primary underline underline-offset-2 hover:no-underline">
                Edge Case Library
              </Link>
              . For OAuth 2.1 migration guidance, see{" "}
              <Link href="/oauth-21" className="text-primary underline underline-offset-2 hover:no-underline">
                OAuth 2.1 Updates
              </Link>
              .
            </p>
            <Button onClick={exportMarkdown} variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Download className="w-4 h-4" />
              Export as Markdown
            </Button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
