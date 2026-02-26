"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ChevronRight,
  AlertTriangle,
  Lock,
  Eye,
  ArrowRight,
  ExternalLink,
  Link2,
  Clock,
  Server,
  Shuffle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { cn } from "@/lib/utils";

interface EdgeCase {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "info";
  icon: React.ReactNode;
  description: string;
}

const edgeCases: EdgeCase[] = [
  { id: "csrf", title: "CSRF & State Parameter", severity: "critical", icon: <ShieldAlert className="w-5 h-5" />, description: "Missing state parameter enables cross-site request forgery on OAuth callbacks." },
  { id: "pkce-downgrade", title: "PKCE Downgrade Attack", severity: "high", icon: <AlertTriangle className="w-5 h-5" />, description: "Attacker strips the code_challenge to bypass PKCE when AS doesn't enforce it." },
  { id: "token-leakage", title: "Token Leakage Scenarios", severity: "high", icon: <Eye className="w-5 h-5" />, description: "Tokens exposed through URL fragments, Referrer headers, browser history, and server logs." },
  { id: "redirect-uri", title: "Redirect URI Validation Attacks", severity: "critical", icon: <Link2 className="w-5 h-5" />, description: "Weak redirect URI matching enables open redirects and token theft." },
  { id: "scope-escalation", title: "Scope Escalation", severity: "medium", icon: <ArrowRight className="w-5 h-5" />, description: "Clients receiving more scopes than requested, violating least-privilege." },
  { id: "token-expiration", title: "Token Expiration Handling", severity: "high", icon: <Clock className="w-5 h-5" />, description: "Race conditions when multiple requests simultaneously detect an expired token." },
  { id: "concurrent-refresh", title: "Concurrent Refresh Token Usage", severity: "high", icon: <Shuffle className="w-5 h-5" />, description: "Two servers simultaneously refreshing the same token triggers reuse detection." },
  { id: "mix-up", title: "OAuth Mix-Up Attack", severity: "critical", icon: <Server className="w-5 h-5" />, description: "Client is tricked into sending one AS's authorization code to a different AS." },
];

const severityConfig = {
  critical: { label: "Critical", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  info: { label: "Info", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
};

const csrfStateCode = `import crypto from "crypto";
import { cookies } from "next/headers";

// Step 1: Generate state when initiating OAuth
export function generateAuthorizationURL(): string {
  // Cryptographically random — NOT Math.random()
  const state = crypto.randomBytes(32).toString("hex");

  // Store in server-side session (httpOnly cookie)
  cookies().set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.CLIENT_ID!,
    redirect_uri: process.env.REDIRECT_URI!,
    scope: "openid profile email",
    state, // ← Include in request
  });

  return \`https://auth.example.com/authorize?\${params}\`;
}

// Step 2: Validate state on callback — BEFORE exchanging the code
export function validateCallback(
  returnedState: string,
  cookieStore: ReturnType<typeof cookies>
): void {
  const storedState = cookieStore.get("oauth_state")?.value;

  // Delete immediately — one-time use
  cookieStore.delete("oauth_state");

  if (!storedState) {
    throw new Error("No state found in session — possible CSRF attack");
  }

  // Use timing-safe comparison to prevent timing attacks
  const storedBuffer = Buffer.from(storedState);
  const returnedBuffer = Buffer.from(returnedState);

  if (
    storedBuffer.length !== returnedBuffer.length ||
    !crypto.timingSafeEqual(storedBuffer, returnedBuffer)
  ) {
    throw new Error("State mismatch — CSRF attack detected, rejecting callback");
  }
}`;

const csrfAttackFlow = `# CSRF Attack Without State Validation
# ─────────────────────────────────────────────────────────────────────────────

# 1. Attacker initiates an OAuth flow with THEIR OWN account
GET https://auth.example.com/authorize
  ?client_id=myapp
  &redirect_uri=https://app.example.com/callback
  &response_type=code
  &scope=read:profile

# 2. AS redirects attacker to callback with a code
# Attacker captures this URL but does NOT follow it:
https://app.example.com/callback?code=ATTACKER_CODE

# 3. Attacker tricks VICTIM into clicking a link to:
https://app.example.com/callback?code=ATTACKER_CODE
# (via email, img src, iframe, etc.)

# 4. Victim's browser follows the link. Without state validation,
# the app exchanges ATTACKER_CODE for tokens tied to the ATTACKER's account.
# Result: Victim is now logged in as the attacker.
# If the app links the account on first login, attacker gains access to victim.

# DEFENSE — With state validation:
# Step 4 fails because victim has no matching oauth_state cookie → rejected.`;

const pkceDowngradeCode = `// Vulnerable Authorization Server (pseudocode)
// This AS allows PKCE to be optional — DANGEROUS
async function handleAuthorizationRequest(req) {
  const { code_challenge, code_challenge_method } = req.query;

  // BUG: PKCE is treated as optional
  const pkce = code_challenge
    ? { challenge: code_challenge, method: code_challenge_method }
    : null; // ← Allows no PKCE!

  const code = generateCode({ pkce });
  return redirect(\`\${redirect_uri}?code=\${code}\`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Secure Authorization Server (OAuth 2.1 compliant)
async function handleAuthorizationRequest(req) {
  const { code_challenge, code_challenge_method } = req.query;

  // PKCE is REQUIRED — reject any request without it
  if (!code_challenge) {
    return error("invalid_request", "code_challenge is required");
  }

  // Only S256 is permitted — plain provides no real security
  if (code_challenge_method !== "S256") {
    return error(
      "invalid_request",
      "code_challenge_method must be S256. 'plain' is not accepted."
    );
  }

  // Validate length (43-128 chars per RFC 7636)
  if (code_challenge.length < 43 || code_challenge.length > 128) {
    return error("invalid_request", "code_challenge length invalid");
  }

  const code = generateCode({ challenge: code_challenge, method: "S256" });
  return redirect(\`\${redirect_uri}?code=\${code}\`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Why "plain" PKCE provides no real security:
//
// With S256:   code_challenge = BASE64URL(SHA256(code_verifier))
//              Attacker intercepting code_challenge cannot reverse SHA256.
//
// With plain:  code_challenge = code_verifier  (identical!)
//              Attacker intercepting the authorization request gets both.
//              They can immediately use code_verifier in the token request.
//
// Conclusion: plain PKCE only defends against passive eavesdroppers who
// cannot see query parameters — which is no threat model worth protecting.`;

const tokenLeakageCode = `// ❌ VULNERABLE: Token in URL query parameter
// Token appears in browser history, server logs, Referer headers
window.location.href =
  \`https://api.example.com/data?access_token=\${token}\`;

// ❌ VULNERABLE: Implicit flow puts token in URL fragment
// Still accessible to third-party JS on the page
// https://app.example.com/callback#access_token=TOKEN&token_type=Bearer

// ✅ SAFE: Token in Authorization header only
const response = await fetch("https://api.example.com/data", {
  headers: {
    Authorization: \`Bearer \${token}\`,
    // No token in URL, path, or query string
  },
});

// ✅ SAFE: Token stored in memory, not localStorage
class TokenStore {
  private accessToken: string | null = null;
  private refreshToken: string | null = null; // httpOnly cookie via BFF

  setAccessToken(token: string) {
    // In-memory only — cleared on page refresh (acceptable tradeoff)
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}`;

const redirectUriCode = `// ❌ VULNERABLE: Wildcard/substring matching
function isValidRedirectUri_INSECURE(registered: string, provided: string): boolean {
  // Allows: *.example.com → evil.example.com matches!
  return provided.startsWith(registered.replace("*", ""));
  // Also vulnerable to: app.example.com/callback/../evil
}

// Test: isValidRedirectUri_INSECURE("https://app.example.com", "https://app.example.com.evil.com")
// Returns: true ← WRONG! Attacker can register app.example.com.evil.com

// ❌ Also vulnerable: prefix matching
function isValidRedirectUri_ALSO_INSECURE(registered: string, provided: string): boolean {
  return provided.startsWith(registered);
  // https://app.example.com/callback → https://app.example.com/callback/../steal works
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ SECURE: Exact string matching (OAuth 2.1 requirement)
function isValidRedirectUri(registeredUris: string[], provided: string): boolean {
  // Normalize to prevent encoding tricks
  const normalizeUri = (uri: string): string => {
    try {
      const url = new URL(uri);
      // Reject path traversal
      if (url.pathname.includes("..")) return "";
      // Normalize: lowercase scheme+host, decode percent-encoding
      return \`\${url.protocol}//\${url.host}\${url.pathname}\${url.search}\`;
    } catch {
      return ""; // Invalid URI
    }
  };

  const normalizedProvided = normalizeUri(provided);
  if (!normalizedProvided) return false;

  // Exact match against the pre-registered list
  return registeredUris.some(
    (uri) => normalizeUri(uri) === normalizedProvided
  );
}

// Registration: only exact URIs, no wildcards
const allowedRedirectUris = [
  "https://app.example.com/callback",
  "https://app.example.com/auth/callback",
  // ✅ Each environment registered separately
  "https://staging.example.com/callback",
];`;

const scopeEscalationCode = `// ❌ VULNERABLE: Server doesn't validate granted scope matches requested scope
async function exchangeCode(code: string) {
  const tokenResponse = await fetch("/oauth/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      // scope not sent — server may grant default or max scope
    }),
  });
  const tokens = await tokenResponse.json();
  // tokens.scope might be "read write admin" even though we needed "read"!
  return tokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ SECURE: Incremental authorization + scope validation
class OAuthClient {
  // Request minimal scope initially
  async initiateLogin(): Promise<string> {
    return buildAuthURL({ scope: "openid profile" }); // minimal
  }

  // Request additional scope only when needed
  async requestAdditionalScope(feature: string): Promise<string> {
    const scopeMap: Record<string, string> = {
      "read-files": "drive.readonly",
      "send-email": "gmail.send",
      "manage-calendar": "calendar",
    };
    const additionalScope = scopeMap[feature];
    if (!additionalScope) throw new Error("Unknown feature");
    return buildAuthURL({ scope: \`openid profile \${additionalScope}\` });
  }

  // ALWAYS validate the granted scope matches what you asked for
  validateGrantedScope(requested: string, granted: string): void {
    const requestedScopes = new Set(requested.split(" "));
    const grantedScopes = new Set(granted.split(" "));

    for (const scope of grantedScopes) {
      if (!requestedScopes.has(scope)) {
        // AS granted more than requested — refuse unexpected privileges
        throw new Error(
          \`Unexpected scope granted: \${scope}. Rejecting token to avoid privilege escalation.\`
        );
      }
    }
  }
}`;

const tokenExpirationCode = `// ❌ VULNERABLE: Race condition — multiple requests all refresh simultaneously
class NaiveTokenManager {
  private accessToken: string = "";
  private expiresAt: number = 0;

  async getToken(): Promise<string> {
    if (Date.now() > this.expiresAt) {
      // If 10 requests arrive simultaneously, all see expired token
      // → 10 simultaneous refresh calls → invalid_grant for 9 of them
      this.accessToken = await this.refresh();
    }
    return this.accessToken;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ SECURE: Mutex-based token refresh with exponential backoff
class TokenManager {
  private accessToken: string = "";
  private expiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;

  async getToken(): Promise<string> {
    // Refresh 60s before actual expiry (prevents edge-case races)
    const needsRefresh = Date.now() > this.expiresAt - 60_000;

    if (!needsRefresh) return this.accessToken;

    // If a refresh is already in flight, wait for it (mutex pattern)
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start refresh — all concurrent callers will await this same promise
    this.refreshPromise = this.doRefresh().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async doRefresh(attempt = 0): Promise<string> {
    const MAX_ATTEMPTS = 3;
    const BACKOFF_MS = [1000, 2000, 4000]; // exponential backoff

    try {
      const response = await fetch("/oauth/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.getStoredRefreshToken(),
          client_id: CLIENT_ID,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "invalid_grant") {
          // Refresh token is revoked — user must re-authenticate
          this.clearTokens();
          throw new Error("SESSION_EXPIRED");
        }
        throw new Error(\`Token refresh failed: \${error.error}\`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.expiresAt = Date.now() + data.expires_in * 1000;
      this.storeRefreshToken(data.refresh_token);
      return this.accessToken;

    } catch (err) {
      if (attempt < MAX_ATTEMPTS - 1 && (err as Error).message !== "SESSION_EXPIRED") {
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
        return this.doRefresh(attempt + 1);
      }
      throw err;
    }
  }

  private getStoredRefreshToken(): string { /* retrieve from secure storage */ return ""; }
  private storeRefreshToken(_token: string): void { /* store securely */ }
  private clearTokens(): void { this.accessToken = ""; this.expiresAt = 0; }
}`;

const concurrentRefreshCode = `// Problem: Distributed systems with multiple server instances
//
// Timeline:
// T=0  Server A: discovers refresh token RT-1 is about to expire
// T=0  Server B: discovers the same RT-1 is about to expire
// T=1  Server A: POST /token { refresh_token: RT-1 } → receives AT-2, RT-2
// T=1  Server B: POST /token { refresh_token: RT-1 } → receives 400 invalid_grant
// T=2  Some AS detect RT-1 reuse as theft → revoke ALL tokens for the user!
//
// User is now logged out on all devices unexpectedly.

// ─────────────────────────────────────────────────────────────────────────────
// Solution 1: Distributed lock with Redis
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });

async function refreshWithDistributedLock(userId: string, refreshToken: string) {
  const lockKey = \`oauth:refresh:lock:\${userId}\`;
  const lockValue = crypto.randomUUID();
  const LOCK_TTL_MS = 10_000; // 10 second lock

  // Try to acquire lock (SET NX — only set if not exists)
  const acquired = await redis.set(lockKey, lockValue, {
    NX: true,
    PX: LOCK_TTL_MS,
  });

  if (!acquired) {
    // Another instance is already refreshing — wait and read shared result
    await waitForRefreshCompletion(userId);
    return await getSharedToken(userId);
  }

  try {
    const newTokens = await callTokenEndpoint(refreshToken);

    // Store new tokens in shared cache so other instances benefit
    await redis.setEx(
      \`oauth:tokens:\${userId}\`,
      newTokens.expires_in,
      JSON.stringify(newTokens)
    );

    return newTokens;
  } finally {
    // Release lock only if we still own it (Lua script for atomicity)
    await redis.eval(
      \`if redis.call("get", KEYS[1]) == ARGV[1] then
         return redis.call("del", KEYS[1])
       else return 0 end\`,
      { keys: [lockKey], arguments: [lockValue] }
    );
  }
}

// Solution 2: Accept invalid_grant gracefully
async function refreshWithFallback(refreshToken: string) {
  try {
    return await callTokenEndpoint(refreshToken);
  } catch (err) {
    if ((err as any).error === "invalid_grant") {
      // Another instance succeeded first — read the new token from shared store
      const cached = await redis.get(\`oauth:tokens:\${currentUserId}\`);
      if (cached) return JSON.parse(cached);
      // No cached token → re-authenticate
      throw new Error("SESSION_EXPIRED");
    }
    throw err;
  }
}`;

const mixUpCode = `# OAuth Mix-Up Attack
# ─────────────────────────────────────────────────────────────────────────────
# Setup: Client is configured with two authorization servers:
#   AS1: https://legit.example.com (attacker controls network, not AS)
#   AS2: https://attacker.example.com (attacker's own AS)

# 1. User clicks "Login with AS1"
# 2. Attacker intercepts/manipulates the request, substituting AS2's endpoint
#    Client sends authorization request to AS2 instead of AS1

# 3. AS2 issues a code bound to AS2
GET https://attacker.example.com/authorize
  ?client_id=myclient&redirect_uri=https://app.example.com/callback&...

# 4. AS2 redirects to the client's callback with its own code:
GET https://app.example.com/callback?code=AS2_CODE&state=...

# 5. Client (confused) sends AS2_CODE to AS1's token endpoint!
POST https://legit.example.com/token
  code=AS2_CODE  ← Code from wrong AS!
  client_id=myclient

# 6. AS1 rejects: code not found. BUT if attacker can observe this exchange,
#    they learn the code and can use it at AS2's endpoint themselves.

# ─────────────────────────────────────────────────────────────────────────────
# Mitigation 1: iss parameter in authorization response (RFC 9207)
GET https://app.example.com/callback
  ?code=AUTH_CODE
  &state=RANDOM_STATE
  &iss=https://legit.example.com  ← AS identifies itself

# Client validates: iss in response == iss used in request
function validateCallback(params, expectedIssuer) {
  if (params.iss !== expectedIssuer) {
    throw new Error("Issuer mismatch — possible mix-up attack");
  }
}

# Mitigation 2: Per-AS state values
# Use a different state for each AS, encode AS identity in state:
const state = base64url(JSON.stringify({
  nonce: crypto.randomBytes(16).toString("hex"),
  issuer: "https://legit.example.com"
}));
# On callback, decode state to know which AS initiated this flow.

# Mitigation 3: JARM (JWT Authorization Response Mode)
# AS signs the authorization response as a JWT, proving which AS sent it.`;

const leakageSeverityItems = [
  {
    type: "URL Fragment (Implicit Flow)",
    severity: "High",
    severityColor: "text-orange-600 dark:text-orange-400",
    how: "Token in URL hash (#access_token=...) — accessible to all JavaScript on the page, including third-party analytics, ads, and CDN-loaded scripts.",
    mitigation: "Never use Implicit flow. Use Authorization Code + PKCE. Tokens never appear in URLs.",
  },
  {
    type: "Referrer Header Leakage",
    severity: "Medium",
    severityColor: "text-yellow-600 dark:text-yellow-400",
    how: "Token in query parameter (?token=...) — leaked via HTTP Referer header when user navigates to any link on the page, or via third-party resource loads.",
    mitigation: "Tokens only in Authorization headers. Set Referrer-Policy: no-referrer on sensitive pages.",
  },
  {
    type: "Browser History",
    severity: "Medium",
    severityColor: "text-yellow-600 dark:text-yellow-400",
    how: "Tokens in URL query strings persist in browser history. Physical access to device or browser sync compromise exposes them.",
    mitigation: "Use POST requests for token exchanges. Replace state after OAuth callback via history.replaceState().",
  },
  {
    type: "Server & Proxy Logs",
    severity: "High",
    severityColor: "text-orange-600 dark:text-orange-400",
    how: "Load balancers, reverse proxies, CDNs, and application servers log full request URLs. Query parameter tokens appear in logs in plaintext and may be stored for months.",
    mitigation: "Configure log scrubbing to redact Authorization headers. Audit all log sinks. Never put tokens in query parameters.",
  },
];

export default function EdgeCasesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <ScrollReveal>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Edge Case Library</span>
        </div>
      </ScrollReveal>

      {/* Hero */}
      <ScrollReveal delay={0.05}>
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Edge Case Library</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-world OAuth attack scenarios, subtle implementation bugs, and their defenses.
            Each case includes an explanation of the attack, a working code example, and actionable mitigation.
          </p>
        </div>
      </ScrollReveal>

      {/* Quick nav */}
      <ScrollReveal delay={0.1}>
        <div className="mb-8 p-4 rounded-lg border bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Jump to</p>
          <div className="flex flex-wrap gap-2">
            {edgeCases.map((ec) => (
              <a
                key={ec.id}
                href={`#${ec.id}`}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border bg-background hover:border-primary/50 hover:text-primary transition-colors"
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  ec.severity === "critical" && "bg-red-500",
                  ec.severity === "high" && "bg-orange-500",
                  ec.severity === "medium" && "bg-yellow-500",
                  ec.severity === "info" && "bg-blue-500",
                )} />
                {ec.title}
              </a>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Accordion */}
      <ScrollReveal delay={0.15}>
        <Accordion type="multiple" className="space-y-3">

          {/* ─── CSRF ─── */}
          <AccordionItem id="csrf" value="csrf" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">CSRF &amp; State Parameter</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.critical.className)}>Critical</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Missing state parameter enables cross-site request forgery on OAuth callbacks</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <span className="text-red-500">Attack</span>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An attacker initiates an OAuth authorization flow using their own account but captures the resulting callback URL without following it.
                  They then trick the victim into opening that URL (via a phishing email, hidden image, or iframe). The victim's browser follows the link,
                  and without state validation, the application completes the OAuth flow — linking the attacker's OAuth identity to the victim's account.
                  The attacker can now log in as the victim.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-base">Attack Flow</h3>
                <CodeBlock code={csrfAttackFlow} language="bash" filename="csrf-attack.sh" />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-base">Defense: State Parameter as CSRF Token</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The state parameter acts as a one-time CSRF token. Generate it with a cryptographically secure random function,
                  store it in the server-side session (httpOnly cookie), and verify it before exchanging the authorization code.
                  A timing-safe comparison prevents timing oracle attacks.
                </p>
                <CodeBlock code={csrfStateCode} language="typescript" filename="oauth-state.ts" />
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Critical Security Note</AlertTitle>
                <AlertDescription>
                  OAuth without state validation is vulnerable to CSRF regardless of PKCE. PKCE protects the code exchange;
                  state protects the callback initiation. You need both.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* ─── PKCE Downgrade ─── */}
          <AccordionItem id="pkce-downgrade" value="pkce-downgrade" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">PKCE Downgrade Attack</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.high.className)}>High</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Attacker strips code_challenge to bypass PKCE when the AS doesn't enforce it</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div>
                <h3 className="font-semibold text-base mb-2 text-red-500">Attack</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An attacker acting as a man-in-the-middle intercepts the authorization request and strips the
                  <code className="text-xs bg-muted px-1 py-0.5 rounded mx-1">code_challenge</code> and
                  <code className="text-xs bg-muted px-1 py-0.5 rounded mx-1">code_challenge_method</code> parameters
                  before forwarding to the AS. If the AS treats PKCE as optional, it issues a code with no challenge attached.
                  The attacker can then exchange this code without providing a verifier, obtaining tokens without the legitimate client's knowledge.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Why "plain" PKCE Provides No Real Security</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Card className="border-red-200 dark:border-red-900">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">plain method (insecure)</p>
                      <code className="text-xs font-mono text-muted-foreground block">
                        code_challenge = code_verifier
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        Attacker who intercepts the authorization request already has the verifier. No security gained.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 dark:border-green-900">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">S256 method (required)</p>
                      <code className="text-xs font-mono text-muted-foreground block">
                        code_challenge = BASE64URL(SHA256(verifier))
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        SHA256 is one-way. Intercepting code_challenge reveals nothing about the verifier.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Defense: AS Must Enforce PKCE</h3>
                <CodeBlock code={pkceDowngradeCode} language="typescript" filename="pkce-enforcement.ts" />
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>OAuth 2.1 Mandates PKCE</AlertTitle>
                <AlertDescription>
                  OAuth 2.1 makes PKCE mandatory for all authorization code flows and explicitly prohibits the "plain" method.
                  If you control the AS, enforce S256. If you are a client, always send code_challenge and verify the AS rejected
                  any request where you omitted it.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Token Leakage ─── */}
          <AccordionItem id="token-leakage" value="token-leakage" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Token Leakage Scenarios</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.high.className)}>High</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Four ways tokens leak and how to prevent each</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div className="space-y-3">
                {leakageSeverityItems.map((item) => (
                  <Card key={item.type} className="overflow-hidden">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <span className={cn("text-xs font-semibold", item.severityColor)}>{item.severity}</span>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <p className="text-sm font-semibold">{item.type}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed"><strong>How it happens:</strong> {item.how}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed"><strong>Mitigation:</strong> {item.mitigation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Token Transport Best Practices</h3>
                <CodeBlock code={tokenLeakageCode} language="typescript" filename="token-transport.ts" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Redirect URI ─── */}
          <AccordionItem id="redirect-uri" value="redirect-uri" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Redirect URI Validation Attacks</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.critical.className)}>Critical</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Weak URI matching enables open redirects and authorization code theft</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div className="grid sm:grid-cols-3 gap-3">
                <Card className="border-red-200 dark:border-red-900">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Open Redirect</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Wildcard matching <code className="bg-muted px-1 rounded">*.example.com</code> allows
                      <code className="bg-muted px-1 rounded mx-1">evil.example.com</code> to receive the authorization code.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 dark:border-red-900">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Path Traversal</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Prefix matching allows <code className="bg-muted px-1 rounded">app.example.com/callback/../evil</code> to
                      bypass validation and redirect elsewhere.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 dark:border-red-900">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Covert Redirect</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A legitimate app's open redirect is used as the redirect_uri, bouncing the code to the attacker's page.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Vulnerable vs. Secure Validation</h3>
                <CodeBlock code={redirectUriCode} language="typescript" filename="redirect-uri-validation.ts" />
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>OAuth 2.1: Exact String Matching Required</AlertTitle>
                <AlertDescription>
                  OAuth 2.1 explicitly requires exact string matching for redirect URIs. No wildcards, no path prefix matching,
                  no dynamic URI construction. Each deployment environment (dev, staging, prod) must register its own exact URI.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Scope Escalation ─── */}
          <AccordionItem id="scope-escalation" value="scope-escalation" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Scope Escalation</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.medium.className)}>Medium</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Clients receiving more permissions than requested, violating least-privilege</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scope escalation occurs when a client requests minimal scopes (e.g., <code className="bg-muted px-1 rounded text-xs">read</code>) but
                  the AS grants broader scopes (e.g., <code className="bg-muted px-1 rounded text-xs">read write admin</code>), either by misconfiguration
                  or because the client didn't send a scope parameter. A compromised client token then has more power than intended.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scope creep also appears in refresh token flows: if the AS grants a new access token with broader scope than the original,
                  the application silently gains new permissions the user never saw in the consent screen.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Incremental Authorization + Scope Validation</h3>
                <CodeBlock code={scopeEscalationCode} language="typescript" filename="scope-management.ts" />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">Best Practice: Incremental Auth</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Request only the scopes needed for the current operation. When the user tries to use a feature requiring more access,
                      trigger a new authorization request for the additional scope. Users see exactly what they are granting at the moment they need it.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Always Validate Granted Scope</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      After every token exchange, compare the <code className="bg-muted px-1 rounded">scope</code> in the response
                      to what you requested. Reject tokens with unexpected scopes rather than silently operating with elevated privileges.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Token Expiration ─── */}
          <AccordionItem id="token-expiration" value="token-expiration" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Token Expiration Handling</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.high.className)}>High</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Race conditions and retry logic when multiple requests see an expired token simultaneously</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-red-500">The Race Condition</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  In any application making concurrent API calls, when the access token expires, multiple in-flight requests simultaneously
                  discover it is invalid. Each independently tries to refresh. The first succeeds and receives a new refresh token
                  (due to refresh token rotation). The remaining attempts fail with <code className="bg-muted px-1 rounded text-xs">invalid_grant</code> because
                  the old refresh token has been revoked. Depending on the AS, this pattern may trigger theft detection and revoke all tokens for the user.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Mutex-Based Token Refresh</h3>
                <CodeBlock code={tokenExpirationCode} language="typescript" filename="token-manager.ts" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Concurrent Refresh ─── */}
          <AccordionItem id="concurrent-refresh" value="concurrent-refresh" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Concurrent Refresh Token Usage</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.high.className)}>High</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Multiple server instances refreshing simultaneously triggers theft detection</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Distributed applications with multiple server replicas (Kubernetes, load-balanced services) may simultaneously
                  attempt to refresh the same refresh token. With refresh token rotation, only the first request succeeds.
                  The second receives <code className="bg-muted px-1 rounded text-xs">invalid_grant</code> because the token was just rotated.
                  Some authorization servers treat this reuse as a sign of token theft and invalidate the entire token family,
                  logging out the user across all devices.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Distributed Locking Solution</h3>
                <CodeBlock code={concurrentRefreshCode} language="typescript" filename="distributed-refresh.ts" />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold mb-2">Option A: Distributed Lock</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Use Redis SET NX to acquire a per-user lock before refreshing. All other instances wait,
                      then read the result from shared cache. Prevents duplicate refresh calls entirely.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold mb-2">Option B: Graceful invalid_grant</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Accept that one refresh will fail. Catch invalid_grant, read the newly-refreshed tokens
                      from shared cache (written by whichever server succeeded). Simpler but depends on shared token store.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Mix-Up ─── */}
          <AccordionItem id="mix-up" value="mix-up" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">OAuth Mix-Up Attack</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", severityConfig.critical.className)}>Critical</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5">Client tricked into sending one AS's authorization code to a different AS</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-5 space-y-5">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When a client supports multiple authorization servers (e.g., "Login with Google" and "Login with GitHub"),
                  a network attacker can manipulate requests to cause the client to send the wrong AS's authorization code to
                  the wrong token endpoint. This can allow the attacker to observe or abuse the code, impersonate users,
                  or cause account linking confusion.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The attack is subtle because the client itself is not compromised — the confusion arises from the client
                  not being able to verify which AS it is interacting with at each step of the flow.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-3">Attack and Mitigations</h3>
                <CodeBlock code={mixUpCode} language="bash" filename="mix-up-attack.sh" />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">RFC 9207: iss parameter</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      AS includes its issuer URL in the callback. Client verifies it matches the expected AS. Simple and effective.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Per-AS State Values</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Encode AS identity inside the state parameter. On callback, decode state to know which AS started the flow.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">JARM</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      JWT Authorization Response Mode — the AS signs the entire response as a JWT, cryptographically binding it to the AS.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </ScrollReveal>

      {/* Footer */}
      <ScrollReveal delay={0.2}>
        <div className="mt-10 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            For a complete security audit checklist, see the{" "}
            <Link href="/checklist" className="text-primary underline underline-offset-2 hover:no-underline">
              Security Checklist
            </Link>
            . For OAuth 2.1 mitigations built into the spec, see{" "}
            <Link href="/oauth-21" className="text-primary underline underline-offset-2 hover:no-underline">
              OAuth 2.1 Updates
            </Link>
            .
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
