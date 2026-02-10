"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Smartphone,
  Server,
  Globe,
  ChevronDown,
  Lock,
  RotateCcw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── HTTP Examples ────────────────────────────────────────────────────────────

const REFRESH_REQUEST_HTTP = `POST /token HTTP/1.1
Host: oauth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=8xLOxBtZp8&
client_id=app-client-123`;

const REFRESH_RESPONSE_HTTP = `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.NEW...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "9yMPoyDuAx7",
  "scope": "openid profile email"
}

# ⚠️  OAuth 2.1: The OLD refresh token (8xLOxBtZp8) is now INVALID.
# Store the new refresh_token (9yMPoyDuAx7) for the next refresh.`;

const EXPIRED_TOKEN_RESPONSE = `HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token",
  error_description="The access token has expired"
Content-Type: application/json

{
  "error": "invalid_token",
  "error_description": "Access token expired at 2024-03-15T15:30:00Z"
}`;

const INVALID_REFRESH_RESPONSE = `HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_grant",
  "error_description": "Refresh token has been revoked or already used."
}`;

// ─── Code Examples ────────────────────────────────────────────────────────────

const JS_EXAMPLE = `// Refresh Token management — JavaScript/TypeScript

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let tokens: Tokens | null = null;
let refreshPromise: Promise<Tokens> | null = null;

async function refreshAccessToken(): Promise<Tokens> {
  // Deduplicate concurrent refresh requests (critical for SPAs!)
  // If a refresh is already in-flight, return the same promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentRefreshToken = tokens?.refreshToken;
    if (!currentRefreshToken) {
      throw new Error('No refresh token available — user must re-authenticate');
    }

    const response = await fetch('https://oauth.example.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentRefreshToken,
        client_id: 'app-client-123',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.error === 'invalid_grant') {
        // Refresh token is expired or revoked — force re-login
        tokens = null;
        clearStoredTokens();
        redirectToLogin();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(\`Token refresh failed: \${error.error_description}\`);
    }

    const data = await response.json();

    // OAuth 2.1: store the NEW refresh token (old one is invalidated)
    tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,  // ← New refresh token!
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    saveTokensSecurely(tokens);
    return tokens;
  })().finally(() => {
    refreshPromise = null; // Clear the deduplication lock
  });

  return refreshPromise;
}

// Wrapper that automatically refreshes expired tokens
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Proactively refresh if token expires in less than 60 seconds
  if (tokens && Date.now() > tokens.expiresAt - 60_000) {
    await refreshAccessToken();
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: \`Bearer \${tokens!.accessToken}\`,
    },
  });

  // Handle 401 — token might have expired mid-flight
  if (response.status === 401) {
    await refreshAccessToken();
    // Retry the request once with the new token
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: \`Bearer \${tokens!.accessToken}\`,
      },
    });
  }

  return response;
}

function saveTokensSecurely(t: Tokens) {
  // For SPAs: store in memory (most secure) or encrypted cookie
  // For backend: store refresh token in httpOnly cookie
  // NEVER: localStorage (XSS vulnerable)
}

function clearStoredTokens() { /* clear storage */ }
function redirectToLogin() { /* redirect to auth */ }`;

const PYTHON_EXAMPLE = `# Refresh Token management — Python with threading safety
import threading
import time
import httpx
from dataclasses import dataclass
from typing import Optional

@dataclass
class Tokens:
    access_token: str
    refresh_token: str
    expires_at: float

class TokenManager:
    def __init__(self):
        self._tokens: Optional[Tokens] = None
        self._lock = threading.Lock()

    def set_tokens(self, access_token: str, refresh_token: str, expires_in: int):
        with self._lock:
            self._tokens = Tokens(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=time.time() + expires_in,
            )

    def get_access_token(self) -> str:
        with self._lock:
            if not self._tokens:
                raise ValueError("Not authenticated")

            # Proactive refresh (60s buffer)
            if time.time() > self._tokens.expires_at - 60:
                self._refresh()

            return self._tokens.access_token

    def _refresh(self):
        """Call with lock held."""
        if not self._tokens or not self._tokens.refresh_token:
            raise ValueError("No refresh token available")

        response = httpx.post(
            'https://oauth.example.com/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': self._tokens.refresh_token,
                'client_id': 'app-client-123',
            }
        )

        if response.status_code == 400:
            error = response.json()
            if error.get('error') == 'invalid_grant':
                self._tokens = None
                raise ValueError("Refresh token expired — re-authentication required")

        response.raise_for_status()
        data = response.json()

        # Store new tokens (OAuth 2.1 rotation)
        self._tokens = Tokens(
            access_token=data['access_token'],
            refresh_token=data['refresh_token'],  # New refresh token
            expires_at=time.time() + data['expires_in'],
        )

# Usage
token_manager = TokenManager()
access_token = token_manager.get_access_token()

response = httpx.get(
    'https://api.example.com/protected',
    headers={'Authorization': f'Bearer {access_token}'}
)`;

const CURL_EXAMPLE = `# Refresh Token flow — cURL

# Assume you have a refresh token from a previous authorization
REFRESH_TOKEN="8xLOxBtZp8"

# Request a new access token
curl -X POST https://oauth.example.com/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=refresh_token" \\
  -d "refresh_token=$REFRESH_TOKEN" \\
  -d "client_id=app-client-123"

# Response includes a NEW refresh token (OAuth 2.1 rotation):
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.NEW...",
#   "token_type": "Bearer",
#   "expires_in": 3600,
#   "refresh_token": "9yMPoyDuAx7"  ← NEW — store this, old one is invalid
# }

# ─── Handling token expiry detection ───────────────────────────────────────

# Check access token expiry (decode JWT payload, no verification needed here)
ACCESS_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Decode the payload (second part of the JWT)
echo $ACCESS_TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq '{exp, iat, sub}'

# Compare exp with current timestamp
EXP=$(echo $ACCESS_TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq '.exp')
NOW=$(date +%s)

if [ $NOW -gt $EXP ]; then
  echo "Token expired — refreshing..."
  # Run the refresh curl command above
fi`;

// ─── Token Lifecycle Visual ───────────────────────────────────────────────────

function TokenLifecycleDiagram() {
  const [activePhase, setActivePhase] = useState<number | null>(null);

  const phases = [
    {
      id: 1,
      label: "Issue",
      sublabel: "Login",
      description: "User logs in → access token + refresh token issued",
      color: "bg-green-500",
      detail: "Access token: 1 hour. Refresh token: days to months depending on app type and AS configuration.",
    },
    {
      id: 2,
      label: "Use",
      sublabel: "0–60 min",
      description: "Access token used for API calls",
      color: "bg-blue-500",
      detail: "Every API call sends Authorization: Bearer <access_token>. The access token is validated by the Resource Server on every request.",
    },
    {
      id: 3,
      label: "Expire",
      sublabel: "~1 hour",
      description: "Access token expires",
      color: "bg-yellow-500",
      detail: "API returns 401 Unauthorized with error=invalid_token. The client must refresh or re-authenticate.",
    },
    {
      id: 4,
      label: "Refresh",
      sublabel: "Silent",
      description: "Client exchanges refresh token → new access token",
      color: "bg-purple-500",
      detail: "No user interaction required. The refresh token is exchanged at the token endpoint. OAuth 2.1 requires returning a new refresh token too (rotation).",
    },
    {
      id: 5,
      label: "Repeat",
      sublabel: "Until RT expires",
      description: "Back to using the new access token",
      color: "bg-blue-500",
      detail: "This cycle repeats until the refresh token itself expires or is revoked (user logs out, password change, revocation by admin).",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {phases.map((phase, idx) => (
          <React.Fragment key={phase.id}>
            <button
              onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex flex-col items-center justify-center border-4 text-white transition-all",
                  phase.color,
                  activePhase === phase.id
                    ? "border-foreground scale-110 shadow-lg"
                    : "border-transparent hover:scale-105"
                )}
              >
                <span className="text-xs font-bold leading-tight">{phase.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{phase.sublabel}</span>
            </button>
            {idx < phases.length - 1 && (
              <div className="flex items-center px-1 shrink-0 mb-4">
                <div className="h-0.5 w-6 bg-border" />
                <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-border" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activePhase !== null && (
          <motion.div
            key={activePhase}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    phases[activePhase - 1].color
                  )}
                />
                <h4 className="font-medium text-sm">
                  Phase {activePhase}: {phases[activePhase - 1].description}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {phases[activePhase - 1].detail}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-center text-muted-foreground">
        Click any phase to learn more.
      </p>
    </div>
  );
}

// ─── Token Rotation Visual ────────────────────────────────────────────────────

function RotationDiagram() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between p-4 rounded-xl border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-semibold text-sm">OAuth 2.1: Refresh Token Rotation</p>
              <p className="text-xs text-muted-foreground">Each use returns a new refresh token — old one is immediately invalidated</p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border rounded-xl space-y-4">
              <div className="font-mono text-xs space-y-2 bg-zinc-950 rounded-lg p-4 text-zinc-300">
                <div className="text-zinc-500"># Refresh #1</div>
                <div>Request:  refresh_token = <span className="text-yellow-400">RT_v1_abc123</span></div>
                <div>Response: access_token  = <span className="text-green-400">AT_new_1</span></div>
                <div>Response: refresh_token = <span className="text-blue-400">RT_v2_def456</span> ← store this</div>
                <div className="text-red-400">           RT_v1_abc123 ← INVALID NOW</div>

                <div className="mt-3 text-zinc-500"># Refresh #2 (using new RT)</div>
                <div>Request:  refresh_token = <span className="text-blue-400">RT_v2_def456</span></div>
                <div>Response: access_token  = <span className="text-green-400">AT_new_2</span></div>
                <div>Response: refresh_token = <span className="text-purple-400">RT_v3_ghi789</span> ← store this</div>
                <div className="text-red-400">           RT_v2_def456 ← INVALID NOW</div>

                <div className="mt-3 text-zinc-500"># Theft Detection: attacker uses old RT</div>
                <div>Request:  refresh_token = <span className="text-yellow-400">RT_v1_abc123</span> (stolen)</div>
                <div className="text-red-400">Response: error = invalid_grant</div>
                <div className="text-zinc-500"># ✓ AS detects reuse of invalidated token</div>
                <div className="text-zinc-500"># ✓ Can revoke entire token family (RT_v2, RT_v3...)</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Refresh token rotation provides <strong>automatic theft detection</strong>. If an attacker steals a refresh token and uses it, the AS sees two uses of the same token family and can revoke all tokens for that session, forcing re-authentication.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RefreshTokenPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Header */}
        <ScrollReveal>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">Token Lifecycle</Badge>
              <Badge variant="success">OAuth 2.0</Badge>
              <Badge variant="info">OAuth 2.1 Required Rotation</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Refresh Token Flow
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Access tokens are intentionally short-lived — typically 15 minutes to 1 hour.
              Refresh tokens allow your application to obtain new access tokens silently,
              without requiring the user to log in again. OAuth 2.1 requires refresh token
              rotation: every use returns a new refresh token and invalidates the old one.
            </p>
          </div>
        </ScrollReveal>

        {/* Token lifetime quick facts */}
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Zap className="w-5 h-5" />, label: "Access Token", value: "15min – 1hr", color: "text-blue-500" },
              { icon: <Clock className="w-5 h-5" />, label: "Refresh Token", value: "Days – Months", color: "text-purple-500" },
              { icon: <RotateCcw className="w-5 h-5" />, label: "Rotation", value: "Per OAuth 2.1", color: "text-green-500" },
              { icon: <Shield className="w-5 h-5" />, label: "Theft Detection", value: "Via rotation", color: "text-orange-500" },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="rounded-xl border bg-muted/30 p-4 text-center space-y-1">
                <div className={cn("flex justify-center", color)}>{icon}</div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <Separator />

        {/* Token Lifecycle */}
        <ScrollReveal>
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Token Lifecycle</h2>
              <p className="text-muted-foreground text-sm">
                Click each phase to understand what happens at each stage.
              </p>
            </div>
            <TokenLifecycleDiagram />
          </section>
        </ScrollReveal>

        <Separator />

        {/* HTTP Examples */}
        <ScrollReveal>
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">HTTP Examples</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  1. Refresh Token Request
                </p>
                <CodeBlock code={REFRESH_REQUEST_HTTP} language="http" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  2. Successful Response (with new refresh token)
                </p>
                <CodeBlock code={REFRESH_RESPONSE_HTTP} language="http" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  3. Expired Access Token (triggers refresh)
                </p>
                <CodeBlock code={EXPIRED_TOKEN_RESPONSE} language="http" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  4. Invalid/Expired Refresh Token (force re-login)
                </p>
                <CodeBlock code={INVALID_REFRESH_RESPONSE} language="json" />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Refresh Token Rotation */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-500" />
              <h2 className="text-2xl font-bold">Refresh Token Rotation</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              OAuth 2.1 requires that every refresh token use returns a new refresh token.
              The old token must be immediately invalidated. This enables theft detection:
              if a stolen token is used, the AS detects the reuse and can revoke the session.
            </p>
            <RotationDiagram />
          </section>
        </ScrollReveal>

        <Separator />

        {/* Concurrent Refresh Handling */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Handling Concurrent Refresh Requests</h2>
            </div>
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Race Condition with Token Rotation</AlertTitle>
              <AlertDescription>
                <p className="mt-1 text-sm">
                  In SPAs with multiple tabs or concurrent requests, two requests may simultaneously
                  detect an expired token and both attempt to refresh. With rotation enabled, the
                  first refresh succeeds and invalidates the old refresh token. The second refresh
                  attempt fails with <code>invalid_grant</code>, causing an unexpected logout.
                </p>
              </AlertDescription>
            </Alert>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h4 className="font-semibold text-sm">Solution: Promise Deduplication</h4>
                <p className="text-sm text-muted-foreground">
                  The standard solution is to maintain a single in-flight refresh promise. Any
                  concurrent request that needs a new token waits on the same promise rather than
                  initiating a new refresh. This is shown in the JavaScript example below
                  (<code>refreshPromise</code> pattern).
                </p>
                <div className="space-y-2">
                  {[
                    "Keep a module-level variable holding the in-flight refresh promise",
                    "Before starting a refresh, check if refreshPromise is already set",
                    "If set, return the existing promise instead of starting a new one",
                    "Clear the promise (set to null) in a finally block after completion",
                    "For multi-tab SPAs: use BroadcastChannel or localStorage events to coordinate across tabs",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Storage Strategies */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Storage Strategies by App Type</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-sm">SPA (React, Vue)</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <div>
                    <p className="font-medium text-foreground mb-1">Access Token</p>
                    <p>In-memory only (module variable). Lost on refresh — that&apos;s OK, use the refresh token.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Refresh Token</p>
                    <p>httpOnly, Secure, SameSite=Strict cookie managed by a backend-for-frontend (BFF) or auth proxy. Never in JS memory.</p>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-2 text-xs text-red-700 dark:text-red-400">
                    Never store refresh tokens in localStorage — accessible to any JS including XSS
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-sm">Mobile (iOS / Android)</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <div>
                    <p className="font-medium text-foreground mb-1">Access Token</p>
                    <p>In-memory or Keychain/Keystore. Mobile OS provides hardware-backed secure storage.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Refresh Token</p>
                    <p>iOS Keychain / Android Keystore. Both support biometric-locked storage for sensitive data.</p>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-2 text-xs text-green-700 dark:text-green-400">
                    Mobile OSes provide secure enclaves — use platform APIs (SecureStorage)
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-sm">Backend / Server</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <div>
                    <p className="font-medium text-foreground mb-1">Access Token</p>
                    <p>In-memory cache (Redis or process memory) with TTL matching token expiry.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Refresh Token</p>
                    <p>Encrypted database storage (AES-256-GCM). The encryption key in a secrets manager. Associate tokens with user sessions.</p>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-2 text-xs text-green-700 dark:text-green-400">
                    Server-side storage is the most secure — tokens never sent to the browser
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Code Examples */}
        <ScrollReveal>
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Complete Code Examples</h2>
            <Tabs defaultValue="javascript">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <TabsContent value="javascript">
                <CodeBlock code={JS_EXAMPLE} language="javascript" filename="token-manager.ts" />
              </TabsContent>
              <TabsContent value="python">
                <CodeBlock code={PYTHON_EXAMPLE} language="python" filename="token_manager.py" />
              </TabsContent>
              <TabsContent value="curl">
                <CodeBlock code={CURL_EXAMPLE} language="bash" filename="refresh-token.sh" />
              </TabsContent>
            </Tabs>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Refresh Token Theft and Mitigation */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              <h2 className="text-2xl font-bold">Refresh Token Theft & Mitigation</h2>
            </div>
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Refresh Tokens Are High-Value Targets</AlertTitle>
              <AlertDescription>
                <p className="mt-1 text-sm">
                  Unlike access tokens (short-lived, ~1 hour), refresh tokens can be valid for
                  days or months. A stolen refresh token gives an attacker long-term access to
                  the user&apos;s account — until the token expires or is manually revoked.
                </p>
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Sender-Constrained Tokens (DPoP)",
                  description:
                    "RFC 9449 (DPoP) binds tokens to a client's private key. Even if intercepted, the token cannot be used without the private key. Supported by major providers.",
                  icon: <Lock className="w-4 h-4 text-blue-500" />,
                },
                {
                  title: "Refresh Token Rotation",
                  description:
                    "Already discussed above. Each use invalidates the old token. Reuse detection allows the AS to revoke the entire token family, flagging the session as compromised.",
                  icon: <RotateCcw className="w-4 h-4 text-purple-500" />,
                },
                {
                  title: "Absolute Expiry",
                  description:
                    "Set a maximum session lifetime regardless of activity. After 24–90 days (depending on app sensitivity), require re-authentication. Limits the window of a stolen token.",
                  icon: <Clock className="w-4 h-4 text-orange-500" />,
                },
                {
                  title: "Anomaly Detection",
                  description:
                    "Track refresh token usage patterns. Alert or revoke on: new country, new device fingerprint, unusual time, or rapid token refresh from different IPs.",
                  icon: <Zap className="w-4 h-4 text-yellow-500" />,
                },
              ].map((item) => (
                <Card key={item.title}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {item.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </ScrollReveal>

      </div>
    </div>
  );
}
