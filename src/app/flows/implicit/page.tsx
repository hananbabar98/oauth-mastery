"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Eye,
  ShieldOff,
  History,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Code Examples ────────────────────────────────────────────────────────────

const DEPRECATED_FLOW_HTTP = `GET /authorize?
  response_type=token&
  client_id=app-client-123&
  redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&
  scope=profile+email&
  state=xK2mN9p4qR
HTTP/1.1
Host: oauth.example.com

# --- Authorization Server redirects with token IN THE URL FRAGMENT ---

HTTP/1.1 302 Found
Location: https://app.example.com/callback#
  access_token=2YotnFZFEjr1zCsicMWpAA&
  token_type=Bearer&
  expires_in=3600&
  scope=profile+email&
  state=xK2mN9p4qR

# ⚠️  The token is now in the URL fragment — visible to:
# - Browser history
# - Referrer headers sent to third-party scripts
# - Server logs if fragment is leaked
# - Browser extensions`;

const WHAT_NOT_TO_DO = `// ❌ DO NOT USE — Implicit flow (deprecated)
// Tokens appear in the URL fragment

function startImplicitFlow() {
  const params = new URLSearchParams({
    response_type: 'token',   // ← This is the implicit grant
    client_id: 'app-client-123',
    redirect_uri: 'https://app.example.com/callback',
    scope: 'profile email',
    state: crypto.randomUUID(),
  });

  window.location.href =
    \`https://oauth.example.com/authorize?\${params}\`;
}

// After redirect back, token is in the URL hash:
// https://app.example.com/callback#access_token=2YotnFZ...

function handleImplicitCallback() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  // This token is already in browser history, referrer headers, logs...
  localStorage.setItem('token', token); // ← doubly bad
}`;

const WHAT_TO_DO_INSTEAD = `// ✅ DO THIS — Authorization Code + PKCE (modern standard)
// Tokens never appear in URLs

async function startAuthCodePKCE() {
  // Generate PKCE pair
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  const state = crypto.randomUUID();

  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',          // ← authorization code grant
    client_id: 'app-client-123',
    redirect_uri: 'https://app.example.com/callback',
    scope: 'openid profile email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',  // ← PKCE protection
  });

  window.location.href =
    \`https://oauth.example.com/authorize?\${params}\`;
}

// Callback only receives a short-lived code in query params
// https://app.example.com/callback?code=SplxlO...&state=...
// The code is useless without the verifier — tokens stay server-side`;

const ATTACK_VECTOR_EXAMPLE = `// Attack Scenario: Authorization Code Interception
//
// WITHOUT PKCE (vulnerable):
// 1. Attacker registers a malicious app with the same redirect_uri
// 2. Authorization code is intercepted (via malicious app on same device)
// 3. Attacker exchanges code for tokens at /token endpoint
// → Full account compromise
//
// WITH PKCE (protected):
// 1. Attacker intercepts the authorization code
// 2. Attempts to exchange at /token endpoint
// 3. AS rejects: attacker doesn't have the code_verifier
// → Attack fails — cryptographic proof required
//
// Implicit flow has ZERO protection against this:
// The access token is returned directly — no exchange step,
// no opportunity to add cryptographic verification.`;

// ─── Attack Vectors ───────────────────────────────────────────────────────────

const ATTACK_VECTORS = [
  {
    title: "Browser History Exposure",
    severity: "Critical",
    description:
      "Tokens in URL fragments are stored in browser history. Anyone with physical access to the device, or any script reading history, can steal tokens.",
    cve: "General vulnerability, not CVE-specific",
  },
  {
    title: "Referrer Header Leakage",
    severity: "High",
    description:
      "Some browsers leak URL fragments (including tokens) in Referer headers when the page loads third-party resources like analytics, fonts, or ads.",
    cve: "Referenced in RFC 6750 §5.3",
  },
  {
    title: "Browser Extension Access",
    severity: "High",
    description:
      "Browser extensions with access to tab URLs can read fragment tokens. Many extensions have broad permissions that allow URL inspection.",
    cve: "CVE-2019-3778 (related Spring Security OAuth)",
  },
  {
    title: "No Token Binding",
    severity: "Critical",
    description:
      "Tokens are returned without any proof of identity. Any party that obtains the token can use it. There is no cryptographic binding to the requesting client.",
    cve: "Design flaw — no CVE",
  },
  {
    title: "Open Redirect + Token Theft",
    severity: "Critical",
    description:
      "If the AS allows open redirect or has a misconfigured redirect_uri, tokens can be redirected to an attacker-controlled URI without the client ever receiving them.",
    cve: "CVE-2020-10663 (related OAuth open redirect pattern)",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function AttackVectorCard({
  vector,
}: {
  vector: (typeof ATTACK_VECTORS)[0];
}) {
  const [open, setOpen] = useState(false);
  const severityColor =
    vector.severity === "Critical"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";

  return (
    <button
      className="w-full text-left"
      onClick={() => setOpen(!open)}
    >
      <div className="rounded-lg border border-red-200 dark:border-red-900/50 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <ShieldOff className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-medium text-sm">{vector.title}</span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                severityColor
              )}
            >
              {vector.severity}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-2 border-t border-red-200 dark:border-red-900/50">
                <p className="text-sm text-muted-foreground">{vector.description}</p>
                <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                  Reference: {vector.cve}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

export default function ImplicitPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* Deprecation Warning — top of page, very prominent */}
        <ScrollReveal>
          <Alert variant="destructive" className="border-2">
            <XCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">DEPRECATED — Do Not Use</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                The Implicit flow has been <strong>officially deprecated</strong> by the OAuth
                working group (OAuth 2.0 Security Best Current Practice, RFC 9700). It is
                removed entirely from the OAuth 2.1 draft specification.
              </p>
              <p>
                Existing implementations should migrate to{" "}
                <Link
                  href="/flows/authorization-code"
                  className="underline font-medium hover:no-underline"
                >
                  Authorization Code + PKCE
                </Link>{" "}
                immediately.
              </p>
            </AlertDescription>
          </Alert>
        </ScrollReveal>

        {/* Header */}
        <ScrollReveal>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="destructive">Deprecated</Badge>
              <Badge variant="outline">OAuth 2.0 (historical)</Badge>
              <Badge variant="destructive">Removed in OAuth 2.1</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Implicit Flow
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              The Implicit flow was created in 2012 to serve browser-based single-page applications
              that could not safely store a client secret. It returned access tokens directly in
              URL fragments — a design that introduced serious security vulnerabilities that were
              not fully understood at the time.
            </p>
          </div>
        </ScrollReveal>

        <Separator />

        {/* Historical Context */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Historical Context</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4 text-sm leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded shrink-0 font-mono">
                    2012
                  </span>
                  <p>
                    OAuth 2.0 (RFC 6749) is published. The Implicit grant is included as a
                    simplified flow for JavaScript apps running in the browser. At the time, CORS
                    was not widely supported, making the Authorization Code flow&#39;s back-channel
                    token exchange difficult from browsers.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded shrink-0 font-mono">
                    2012–2018
                  </span>
                  <p>
                    Widely adopted for SPAs. Security researchers gradually document concerns about
                    token leakage via referrer headers, browser history, and open redirects. CORS
                    improves and makes back-channel requests feasible.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded shrink-0 font-mono">
                    2018
                  </span>
                  <p>
                    RFC 7636 (PKCE) gains widespread adoption. The OAuth Security Best Current
                    Practice document begins formal work on recommending against the Implicit flow.
                    Auth0 and major providers start recommending migration.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded shrink-0 font-mono">
                    2019
                  </span>
                  <p>
                    OAuth 2.0 Security Best Current Practice (draft) explicitly recommends{" "}
                    <strong>not using the Implicit flow</strong>. PKCE + Authorization Code is
                    recommended for all client types, including SPAs.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded shrink-0 font-mono">
                    2024+
                  </span>
                  <p>
                    OAuth 2.1 draft removes the Implicit grant entirely. All major identity
                    providers (Google, Microsoft, Auth0, Okta) have deprecated or disabled it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Why It Was Created */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Why It Was Created</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <h3 className="font-medium text-sm">The 2012 Problem</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>JavaScript SPAs in 2012 faced a hard constraint: they could not safely store a <code>client_secret</code>. Any secret embedded in client-side code is visible to anyone who opens DevTools.</p>
                  <p>The Authorization Code flow required a server-side component to exchange the code for tokens — something many SPA developers wanted to avoid.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldOff className="w-4 h-4" />
                    <h3 className="font-medium text-sm">The Solution (and its flaw)</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>The Implicit flow skipped the token exchange entirely — returning the access token directly in the URL fragment after user authorization.</p>
                  <p>This seemed elegant: no client secret needed. But it put tokens in the URL, where they could leak in countless ways not foreseen at the time.</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </ScrollReveal>

        <Separator />

        {/* The Deprecated Flow */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-red-500" />
              <h2 className="text-2xl font-bold">What the Flow Looked Like</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This is shown for educational purposes only. The token arrives in the URL — notice
              the <code>#</code> hash fragment.
            </p>
            <CodeBlock
              code={DEPRECATED_FLOW_HTTP}
              language="http"
              filename="implicit-flow.http (deprecated)"
            />
          </section>
        </ScrollReveal>

        <Separator />

        {/* Attack Vectors */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-2xl font-bold">Attack Vectors</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Click each attack vector to learn more. These apply specifically to the Implicit flow.
            </p>
            <div className="space-y-2">
              {ATTACK_VECTORS.map((v) => (
                <AttackVectorCard key={v.title} vector={v} />
              ))}
            </div>
          </section>
        </ScrollReveal>

        <Separator />

        {/* What NOT to do vs What TO do */}
        <ScrollReveal>
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">What Not to Do vs. What to Do</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Do Not Use — Implicit Flow
                  </span>
                </div>
                <CodeBlock
                  code={WHAT_NOT_TO_DO}
                  language="javascript"
                  filename="dont-do-this.js"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Do This Instead — Authorization Code + PKCE
                  </span>
                </div>
                <CodeBlock
                  code={WHAT_TO_DO_INSTEAD}
                  language="javascript"
                  filename="do-this-instead.js"
                />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <Separator />

        {/* PKCE vs No PKCE Attack */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Why PKCE Blocks the Core Attack</h2>
            <CodeBlock
              code={ATTACK_VECTOR_EXAMPLE}
              language="javascript"
              filename="attack-scenario.js"
            />
          </section>
        </ScrollReveal>

        <Separator />

        {/* Migration Path */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Migration Path</h2>
            <Card className="border-green-200 dark:border-green-800/50">
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Migrating from Implicit to Authorization Code + PKCE requires minimal changes.
                  The user experience is identical — users still click login and get redirected
                  back. The security improvement is entirely under the hood.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      step: "1",
                      text: 'Change response_type from "token" to "code"',
                    },
                    {
                      step: "2",
                      text: "Generate a PKCE verifier and challenge before each auth request",
                    },
                    {
                      step: "3",
                      text: "Add code_challenge and code_challenge_method=S256 to the authorization request",
                    },
                    {
                      step: "4",
                      text: "On callback, exchange the code for tokens at the /token endpoint (include code_verifier)",
                    },
                    {
                      step: "5",
                      text: "Store tokens in memory or httpOnly cookies — not localStorage",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
                        {item.step}
                      </span>
                      <p className="text-sm pt-0.5">{item.text}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Link
                    href="/flows/authorization-code"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    View full Authorization Code + PKCE guide
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollReveal>

      </div>
    </div>
  );
}
