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
  ShieldCheck,
  User,
  Server,
  Database,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Lock,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── HTTP Examples ────────────────────────────────────────────────────────────

const STEP_HTTP: Record<number, { label: string; code: string; language: string }[]> = {
  1: [
    {
      label: "Authorization Request",
      language: "http",
      code: `GET /authorize?
  response_type=code&
  client_id=app-client-123&
  redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&
  scope=openid+profile+email&
  state=xK2mN9p4qR&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
HTTP/1.1
Host: oauth.example.com`,
    },
  ],
  2: [
    {
      label: "Authorization Response",
      language: "http",
      code: `HTTP/1.1 302 Found
Location: https://app.example.com/callback?
  code=SplxlOBeZQQYbYS6WxSbIA&
  state=xK2mN9p4qR`,
    },
  ],
  3: [
    {
      label: "Token Exchange Request",
      language: "http",
      code: `POST /token HTTP/1.1
Host: oauth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=SplxlOBeZQQYbYS6WxSbIA&
redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&
client_id=app-client-123&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`,
    },
    {
      label: "Token Response",
      language: "json",
      code: `{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}`,
    },
  ],
  4: [
    {
      label: "API Call with Access Token",
      language: "http",
      code: `GET /userinfo HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`,
    },
    {
      label: "Resource Server Response",
      language: "json",
      code: `{
  "sub": "user-8472",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "email_verified": true,
  "picture": "https://cdn.example.com/avatars/jane.jpg"
}`,
    },
  ],
};

// ─── Flow Steps ───────────────────────────────────────────────────────────────

interface FlowStep {
  number: number;
  title: string;
  description: string;
  from: string;
  to: string;
  color: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    number: 1,
    title: "User Clicks Login",
    description:
      "The client generates a random code_verifier, derives the code_challenge via SHA-256, then redirects the user to the Authorization Server.",
    from: "Client App",
    to: "Auth Server",
    color: "bg-blue-500",
  },
  {
    number: 2,
    title: "User Authenticates",
    description:
      "The user logs in and grants consent. The Authorization Server redirects back with a short-lived authorization code (valid ~60 seconds).",
    from: "Auth Server",
    to: "Client App",
    color: "bg-green-500",
  },
  {
    number: 3,
    title: "Code Exchange",
    description:
      "The client sends the code + code_verifier to the token endpoint. The AS verifies the PKCE proof and issues tokens.",
    from: "Client App",
    to: "Auth Server",
    color: "bg-purple-500",
  },
  {
    number: 4,
    title: "Access Protected Resource",
    description:
      "The client includes the access token as a Bearer token in the Authorization header to call the Resource Server.",
    from: "Client App",
    to: "Resource Server",
    color: "bg-orange-500",
  },
];

// ─── Code Examples ────────────────────────────────────────────────────────────

const JS_EXAMPLE = `// Full Authorization Code + PKCE flow in JavaScript

// Step 1: Generate PKCE pair
async function generatePKCE() {
  const verifier = crypto.getRandomValues(new Uint8Array(32));
  const verifierStr = btoa(String.fromCharCode(...verifier))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const encoder = new TextEncoder();
  const data = encoder.encode(verifierStr);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return { verifier: verifierStr, challenge };
}

// Step 2: Build authorization URL
async function startAuth() {
  const { verifier, challenge } = await generatePKCE();
  const state = crypto.randomUUID();

  // Store for later use
  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'app-client-123',
    redirect_uri: 'https://app.example.com/callback',
    scope: 'openid profile email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = \`https://oauth.example.com/authorize?\${params}\`;
}

// Step 3: Handle callback and exchange code
async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  // Verify state to prevent CSRF
  if (state !== sessionStorage.getItem('oauth_state')) {
    throw new Error('State mismatch — possible CSRF attack');
  }

  const verifier = sessionStorage.getItem('pkce_verifier');

  const response = await fetch('https://oauth.example.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: 'app-client-123',
      code_verifier: verifier,
    }),
  });

  const tokens = await response.json();
  // Store tokens securely — never in localStorage for sensitive apps
  return tokens;
}`;

const PYTHON_EXAMPLE = `import hashlib, base64, os, secrets
import urllib.parse
import httpx

# Step 1: Generate PKCE pair
def generate_pkce():
    verifier_bytes = secrets.token_bytes(32)
    verifier = base64.urlsafe_b64encode(verifier_bytes).rstrip(b'=').decode()

    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()

    return verifier, challenge

# Step 2: Build authorization URL
def build_auth_url():
    verifier, challenge = generate_pkce()
    state = secrets.token_urlsafe(16)

    # Save verifier and state (e.g., in session)
    session = {'pkce_verifier': verifier, 'oauth_state': state}

    params = {
        'response_type': 'code',
        'client_id': 'app-client-123',
        'redirect_uri': 'https://app.example.com/callback',
        'scope': 'openid profile email',
        'state': state,
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
    }

    url = 'https://oauth.example.com/authorize?' + urllib.parse.urlencode(params)
    return url, session

# Step 3: Exchange code for tokens
def exchange_code(code: str, verifier: str):
    response = httpx.post(
        'https://oauth.example.com/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': 'https://app.example.com/callback',
            'client_id': 'app-client-123',
            'code_verifier': verifier,
        }
    )
    response.raise_for_status()
    return response.json()`;

const CURL_EXAMPLE = `# Step 1: Generate code_verifier and code_challenge
# (run this in your terminal)
VERIFIER=$(openssl rand -base64 32 | tr -d '=+/' | head -c 43)
CHALLENGE=$(echo -n "$VERIFIER" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')

echo "Verifier: $VERIFIER"
echo "Challenge: $CHALLENGE"

# Step 2: Open this URL in browser (replace challenge value)
# https://oauth.example.com/authorize?
#   response_type=code&
#   client_id=app-client-123&
#   redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&
#   scope=openid+profile+email&
#   state=xK2mN9p4qR&
#   code_challenge=$CHALLENGE&
#   code_challenge_method=S256

# Step 3: After redirect, exchange the code
CODE="SplxlOBeZQQYbYS6WxSbIA"  # from redirect URL

curl -X POST https://oauth.example.com/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=$CODE" \\
  -d "redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback" \\
  -d "client_id=app-client-123" \\
  -d "code_verifier=$VERIFIER"

# Step 4: Use the access token
ACCESS_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

curl https://api.example.com/userinfo \\
  -H "Authorization: Bearer $ACCESS_TOKEN"`;

const PKCE_JS_EXAMPLE = `// PKCE Math: verifier → SHA-256 → base64url = challenge

async function generateCodeVerifier(): Promise<string> {
  // 32 random bytes → 43 base64url chars (≥43 chars required by spec)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')   // base64url: + → -
    .replace(/\//g, '_')   // base64url: / → _
    .replace(/=/g, '');    // base64url: strip padding
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  // SHA-256 hash the verifier
  const hash = await crypto.subtle.digest('SHA-256', data);
  // base64url-encode the hash
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Example output:
// verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
// challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
//
// The AS stores the challenge. When you send the verifier at token time,
// it hashes it and compares — proving you're the same party that initiated auth.`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActorCard({
  icon,
  name,
  description,
  color,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  color: string;
}) {
  return (
    <div className={cn("rounded-xl border-2 p-5", color)}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-semibold text-base">{name}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function FlowDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Steps */}
      <div className="space-y-3">
        {FLOW_STEPS.map((step, idx) => (
          <div key={step.number}>
            <button
              onClick={() => setActiveStep(activeStep === step.number ? null : step.number)}
              className="w-full text-left"
            >
              <div
                className={cn(
                  "flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                  activeStep === step.number
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold",
                    step.color
                  )}
                >
                  {step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{step.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {step.from} → {step.to}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    activeStep === step.number && "rotate-180"
                  )}
                />
              </div>
            </button>

            {/* Arrow between steps */}
            {idx < FLOW_STEPS.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowRight className="w-4 h-4 rotate-90 text-muted-foreground/40" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* HTTP Detail Panel */}
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
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    FLOW_STEPS[activeStep - 1].color
                  )}
                />
                <h4 className="font-medium text-sm">
                  Step {activeStep}: {FLOW_STEPS[activeStep - 1].title} — HTTP Details
                </h4>
              </div>
              {STEP_HTTP[activeStep]?.map((ex) => (
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
        Click any step to reveal the HTTP request/response details.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuthorizationCodePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Header */}
        <ScrollReveal>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">OAuth 2.0</Badge>
              <Badge variant="default">OAuth 2.1 Required</Badge>
              <Badge variant="info">PKCE</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Authorization Code + PKCE
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Authorization Code flow is the most secure and widely recommended grant type. It
              separates the token exchange from the browser, preventing tokens from appearing in
              URLs or browser history. PKCE (Proof Key for Code Exchange) adds cryptographic
              protection against authorization code interception attacks.
            </p>
          </div>
        </ScrollReveal>

        <Separator />

        {/* Four Actors */}
        <ScrollReveal>
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">The Four Actors</h2>
              <p className="text-muted-foreground text-sm">
                OAuth 2.0 defines four roles that participate in the flow.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ActorCard
                icon={<User className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                name="Resource Owner"
                description="The user who owns the data and grants permission to the client application to access it on their behalf."
                color="border-blue-200 dark:border-blue-800/50"
              />
              <ActorCard
                icon={<ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />}
                name="Client"
                description="The application requesting access to the resource owner's data (your web app, mobile app, or SPA)."
                color="border-green-200 dark:border-green-800/50"
              />
              <ActorCard
                icon={<Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                name="Authorization Server"
                description="Issues access tokens after authenticating the resource owner and obtaining authorization. Examples: Auth0, Okta, Keycloak, Google."
                color="border-purple-200 dark:border-purple-800/50"
              />
              <ActorCard
                icon={<Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                name="Resource Server"
                description="Hosts the protected resources. Validates the access token on each request and returns data if valid."
                color="border-orange-200 dark:border-orange-800/50"
              />
            </div>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Flow Steps */}
        <ScrollReveal>
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Flow Steps</h2>
              <p className="text-muted-foreground text-sm">
                Click each step to see the exact HTTP request and response.
              </p>
            </div>
            <FlowDiagram />
          </section>
        </ScrollReveal>

        <Separator />

        {/* PKCE Deep Dive */}
        <ScrollReveal>
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">PKCE Deep Dive</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                PKCE (RFC 7636) was designed for public clients (mobile, SPA) that cannot keep
                a client_secret safe. It uses a one-time cryptographic proof to bind the
                authorization request to the token exchange.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">code_verifier</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>A random, high-entropy string (43–128 characters) generated fresh for each authorization request.</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Generated client-side, never sent to the AS initially</li>
                    <li>Only revealed during token exchange</li>
                    <li>Characters: [A-Z] [a-z] [0-9] - . _ ~</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">code_challenge</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>The SHA-256 hash of the verifier, base64url-encoded. Sent in the authorization request.</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>AS stores the challenge with the authorization code</li>
                    <li>S256 is required (plain is deprecated)</li>
                    <li>Verifies the token requester initiated auth</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                The Math: verifier → SHA-256 → base64url = challenge
              </p>
              <div className="font-mono text-sm bg-zinc-950 rounded-lg p-4 text-zinc-300 overflow-x-auto">
                <div className="text-purple-400">code_verifier</div>
                <div className="text-zinc-500 my-1 pl-4">↓ SHA-256 hash</div>
                <div className="text-blue-400">32-byte digest</div>
                <div className="text-zinc-500 my-1 pl-4">↓ base64url encode (no padding)</div>
                <div className="text-green-400">code_challenge</div>
              </div>
            </div>

            <CodeBlock
              code={PKCE_JS_EXAMPLE}
              language="typescript"
              filename="pkce.ts"
            />
          </section>
        </ScrollReveal>

        <Separator />

        {/* Complete Code Examples */}
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
                <CodeBlock code={JS_EXAMPLE} language="javascript" filename="oauth.js" />
              </TabsContent>
              <TabsContent value="python">
                <CodeBlock code={PYTHON_EXAMPLE} language="python" filename="oauth.py" />
              </TabsContent>
              <TabsContent value="curl">
                <CodeBlock code={CURL_EXAMPLE} language="bash" filename="oauth.sh" />
              </TabsContent>
            </Tabs>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Security Pitfalls */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Security Pitfalls</h2>
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Common Mistakes to Avoid</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold shrink-0">•</span>
                    <span><strong>Skipping state validation:</strong> Always verify the state parameter on callback to prevent CSRF attacks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold shrink-0">•</span>
                    <span><strong>Storing tokens in localStorage:</strong> Susceptible to XSS. Use httpOnly cookies or in-memory storage for sensitive apps.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold shrink-0">•</span>
                    <span><strong>Using <code>plain</code> challenge method:</strong> Always use S256. The plain method provides no security benefit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold shrink-0">•</span>
                    <span><strong>Open redirect vulnerabilities:</strong> Validate and whitelist redirect_uri exactly — no wildcard matching.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold shrink-0">•</span>
                    <span><strong>Reusing the code_verifier:</strong> Generate a fresh verifier for every authorization request.</span>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </section>
        </ScrollReveal>

        <Separator />

        {/* OAuth 2.1 Changes */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">OAuth 2.1 Changes</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">PKCE is required for all authorization code flows</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      OAuth 2.1 (draft) mandates PKCE for all clients, not just public clients. Confidential clients must also use PKCE.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Implicit flow is formally removed</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      The implicit grant type is entirely removed from OAuth 2.1.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Refresh token rotation is required</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Each use of a refresh token must return a new refresh token. The old one is invalidated immediately.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Exact redirect_uri matching is required</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Wildcard and partial matching of redirect URIs is prohibited.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollReveal>

      </div>
    </div>
  );
}
