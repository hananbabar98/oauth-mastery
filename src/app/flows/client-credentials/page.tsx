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
  Server,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Database,
  ChevronDown,
  Cpu,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── HTTP Examples ────────────────────────────────────────────────────────────

const TOKEN_REQUEST_HTTP = `POST /token HTTP/1.1
Host: oauth.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic YXBwLWNsaWVudC0xMjM6c2VjcmV0LWtleS14eXo=

grant_type=client_credentials&
scope=read%3Areports+write%3Aevents`;

const TOKEN_RESPONSE_HTTP = `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:reports write:events"
}

# Note: No refresh_token — client_credentials flow does not issue refresh tokens.
# When the token expires, the service simply requests a new one.`;

const API_CALL_HTTP = `GET /api/v1/reports/summary HTTP/1.1
Host: api.internal.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json`;

const API_RESPONSE_HTTP = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "report_id": "rpt-20240315",
  "generated_at": "2024-03-15T14:30:00Z",
  "total_events": 14782,
  "status": "complete"
}`;

// ─── Code Examples ────────────────────────────────────────────────────────────

const JS_EXAMPLE = `// Client Credentials flow — Node.js / TypeScript

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getServiceToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const response = await fetch('https://oauth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // HTTP Basic auth: base64(client_id:client_secret)
      'Authorization': 'Basic ' + btoa(
        process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET
      ),
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read:reports write:events',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(\`Token request failed: \${error.error_description}\`);
  }

  const data = await response.json();

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

// Usage: automatically handles token refresh
async function callProtectedApi(endpoint: string) {
  const token = await getServiceToken();

  const response = await fetch(\`https://api.internal.example.com\${endpoint}\`, {
    headers: {
      Authorization: \`Bearer \${token}\`,
      Accept: 'application/json',
    },
  });

  return response.json();
}

// Example usage
const report = await callProtectedApi('/api/v1/reports/summary');`;

const PYTHON_EXAMPLE = `# Client Credentials flow — Python with caching
import os
import time
import base64
import httpx
from dataclasses import dataclass
from typing import Optional

@dataclass
class TokenCache:
    access_token: str
    expires_at: float

_token_cache: Optional[TokenCache] = None

def get_service_token() -> str:
    global _token_cache

    # Return cached token if still valid (60s buffer)
    if _token_cache and time.time() < _token_cache.expires_at - 60:
        return _token_cache.access_token

    client_id = os.environ['CLIENT_ID']
    client_secret = os.environ['CLIENT_SECRET']

    # HTTP Basic Auth encoding
    credentials = base64.b64encode(
        f"{client_id}:{client_secret}".encode()
    ).decode()

    response = httpx.post(
        'https://oauth.example.com/token',
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {credentials}',
        },
        data={
            'grant_type': 'client_credentials',
            'scope': 'read:reports write:events',
        }
    )
    response.raise_for_status()
    data = response.json()

    _token_cache = TokenCache(
        access_token=data['access_token'],
        expires_at=time.time() + data['expires_in'],
    )

    return _token_cache.access_token

def call_protected_api(endpoint: str) -> dict:
    token = get_service_token()
    response = httpx.get(
        f"https://api.internal.example.com{endpoint}",
        headers={'Authorization': f'Bearer {token}'},
    )
    response.raise_for_status()
    return response.json()

# Example usage
report = call_protected_api('/api/v1/reports/summary')`;

const GO_EXAMPLE = `// Client Credentials flow — Go

package auth

import (
    "encoding/base64"
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "os"
    "strings"
    "sync"
    "time"
)

type TokenCache struct {
    AccessToken string
    ExpiresAt   time.Time
    mu          sync.RWMutex
}

var cache = &TokenCache{}

type tokenResponse struct {
    AccessToken string \`json:"access_token"\`
    TokenType   string \`json:"token_type"\`
    ExpiresIn   int    \`json:"expires_in"\`
    Scope       string \`json:"scope"\`
}

func GetServiceToken() (string, error) {
    cache.mu.RLock()
    if cache.AccessToken != "" && time.Now().Before(cache.ExpiresAt.Add(-60*time.Second)) {
        token := cache.AccessToken
        cache.mu.RUnlock()
        return token, nil
    }
    cache.mu.RUnlock()

    clientID := os.Getenv("CLIENT_ID")
    clientSecret := os.Getenv("CLIENT_SECRET")
    credentials := base64.StdEncoding.EncodeToString(
        []byte(clientID + ":" + clientSecret),
    )

    body := url.Values{
        "grant_type": {"client_credentials"},
        "scope":      {"read:reports write:events"},
    }

    req, _ := http.NewRequest("POST",
        "https://oauth.example.com/token",
        strings.NewReader(body.Encode()),
    )
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    req.Header.Set("Authorization", "Basic "+credentials)

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return "", fmt.Errorf("token request failed: %w", err)
    }
    defer resp.Body.Close()

    var tr tokenResponse
    if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
        return "", err
    }

    cache.mu.Lock()
    cache.AccessToken = tr.AccessToken
    cache.ExpiresAt = time.Now().Add(time.Duration(tr.ExpiresIn) * time.Second)
    cache.mu.Unlock()

    return tr.AccessToken, nil
}`;

const CURL_EXAMPLE = `# Client Credentials — cURL examples

# Step 1: Get an access token
# Option A: HTTP Basic Auth (recommended)
curl -X POST https://oauth.example.com/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "Authorization: Basic $(echo -n 'app-client-123:secret-key-xyz' | base64)" \\
  -d "grant_type=client_credentials" \\
  -d "scope=read:reports write:events"

# Option B: Credentials in body (less preferred)
curl -X POST https://oauth.example.com/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=app-client-123" \\
  -d "client_secret=secret-key-xyz" \\
  -d "scope=read:reports write:events"

# Response:
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer",
#   "expires_in": 3600
# }

# Step 2: Use the token
ACCESS_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

curl https://api.internal.example.com/api/v1/reports/summary \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Accept: application/json"`;

// ─── Flow Diagram Steps ───────────────────────────────────────────────────────

interface DiagramStep {
  id: number;
  label: string;
  from: string;
  to: string;
  description: string;
}

const DIAGRAM_STEPS: DiagramStep[] = [
  {
    id: 1,
    label: "Token Request",
    from: "Your Service",
    to: "Auth Server",
    description:
      "Service sends client_id + client_secret (via Basic Auth or body) with requested scopes.",
  },
  {
    id: 2,
    label: "Access Token Issued",
    from: "Auth Server",
    to: "Your Service",
    description:
      "AS validates credentials and issues an access token. No refresh token is issued.",
  },
  {
    id: 3,
    label: "API Call",
    from: "Your Service",
    to: "Resource Server",
    description:
      "Service includes the Bearer token in the Authorization header of every API call.",
  },
  {
    id: 4,
    label: "Protected Resource",
    from: "Resource Server",
    to: "Your Service",
    description:
      "RS validates the token (checks signature, expiry, scope) and returns the requested data.",
  },
];

const STEP_HTTP_DETAILS: Record<number, { label: string; code: string; language: string }[]> = {
  1: [{ label: "Token Request", code: TOKEN_REQUEST_HTTP, language: "http" }],
  2: [{ label: "Token Response", code: TOKEN_RESPONSE_HTTP, language: "http" }],
  3: [{ label: "API Call", code: API_CALL_HTTP, language: "http" }],
  4: [{ label: "API Response", code: API_RESPONSE_HTTP, language: "json" }],
};

function FlowDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {DIAGRAM_STEPS.map((step, idx) => (
          <div key={step.id}>
            <button
              className="w-full text-left"
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
            >
              <div
                className={cn(
                  "flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                  activeStep === step.id
                    ? "border-blue-500 bg-blue-500/5"
                    : "border-border hover:border-blue-400/40 hover:bg-muted/40"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
                  {step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{step.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {step.from} → {step.to}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 shrink-0 text-muted-foreground transition-transform",
                    activeStep === step.id && "rotate-180"
                  )}
                />
              </div>
            </button>
            {idx < DIAGRAM_STEPS.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowRight className="w-4 h-4 rotate-90 text-muted-foreground/40" />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeStep !== null && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
              <h4 className="font-medium text-sm">
                Step {activeStep}: {DIAGRAM_STEPS[activeStep - 1].label}
              </h4>
              {STEP_HTTP_DETAILS[activeStep]?.map((ex) => (
                <div key={ex.label}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    {ex.label}
                  </p>
                  <CodeBlock code={ex.code} language={ex.language} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-center text-muted-foreground">
        Click any step to reveal HTTP details.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientCredentialsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Header */}
        <ScrollReveal>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Machine-to-Machine</Badge>
              <Badge variant="success">OAuth 2.0</Badge>
              <Badge variant="default">OAuth 2.1</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Client Credentials Flow
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              No user involved. Your service authenticates directly with the Authorization Server
              using its <code className="text-foreground">client_id</code> and{" "}
              <code className="text-foreground">client_secret</code>. This is the go-to flow
              for service-to-service communication and automated workloads.
            </p>
          </div>
        </ScrollReveal>

        {/* When to use */}
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Cpu className="w-5 h-5" />, label: "Microservices" },
              { icon: <Server className="w-5 h-5" />, label: "CI/CD Pipelines" },
              { icon: <Database className="w-5 h-5" />, label: "Scheduled Jobs" },
              { icon: <Lock className="w-5 h-5" />, label: "Backend APIs" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-4 text-center"
              >
                <div className="text-blue-500">{icon}</div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <Separator />

        {/* Security Warning */}
        <ScrollReveal>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Never Use in Browser or Mobile Apps</AlertTitle>
            <AlertDescription>
              <p className="mt-1">
                The <code>client_secret</code> must remain confidential. If used in a SPA,
                mobile app, or any client-side code, the secret is exposed to every user and
                can be trivially extracted from network traffic or source code.
              </p>
              <p className="mt-2">
                Client Credentials is exclusively for confidential clients running in secure
                server environments with access to secrets management (e.g., AWS Secrets
                Manager, HashiCorp Vault, Kubernetes Secrets).
              </p>
            </AlertDescription>
          </Alert>
        </ScrollReveal>

        <Separator />

        {/* Flow Diagram */}
        <ScrollReveal>
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Flow Diagram</h2>
              <p className="text-muted-foreground text-sm">
                Two-step flow: get a token, use the token. Click each step for HTTP details.
              </p>
            </div>
            <FlowDiagram />
          </section>
        </ScrollReveal>

        <Separator />

        {/* Token Storage */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Token Storage for Backend Services</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-sm">In-Memory Cache</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Cache the token in process memory with its expiry time. Refresh proactively before expiry (60-second buffer recommended). Works well for single-instance services.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-sm">Distributed Cache (Redis)</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>For horizontally scaled services, store tokens in Redis with a TTL. All instances share the token, reducing token requests to the AS. Use SET with NX and EX for atomic writes.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-sm">Secrets Management</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Store <code>client_secret</code> in AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault. Never in environment variables committed to source control or Docker images.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-sm">Credential Rotation</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Rotate client_secret regularly. Most authorization servers support registering multiple secrets simultaneously to enable zero-downtime rotation (add new → deploy → remove old).</p>
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
                <TabsTrigger value="go">Go</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <TabsContent value="javascript">
                <CodeBlock code={JS_EXAMPLE} language="javascript" filename="service-auth.js" />
              </TabsContent>
              <TabsContent value="python">
                <CodeBlock code={PYTHON_EXAMPLE} language="python" filename="service_auth.py" />
              </TabsContent>
              <TabsContent value="go">
                <CodeBlock code={GO_EXAMPLE} language="go" filename="auth/token.go" />
              </TabsContent>
              <TabsContent value="curl">
                <CodeBlock code={CURL_EXAMPLE} language="bash" filename="service-auth.sh" />
              </TabsContent>
            </Tabs>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Scope Design */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Scope Design for Service Accounts</h2>
            <Card>
              <CardContent className="pt-6 space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Follow the principle of least privilege. Each service should request only the
                  scopes it actually needs.
                </p>
                <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs space-y-1">
                  <div className="text-muted-foreground"># Instead of:</div>
                  <div className="text-red-400">scope=admin</div>
                  <div className="mt-3 text-muted-foreground"># Use granular scopes:</div>
                  <div className="text-green-400">scope=read:reports</div>
                  <div className="text-green-400">scope=write:events read:users</div>
                  <div className="text-green-400">scope=reports:read events:write</div>
                </div>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Use resource:action naming convention (read:reports, write:events)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Register separate clients for different service boundaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Audit token usage to discover scope sprawl</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Consider using mTLS (RFC 8705) instead of client_secret for high-security environments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </ScrollReveal>

      </div>
    </div>
  );
}
