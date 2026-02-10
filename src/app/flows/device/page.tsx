"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/ui/code-block";
import { Progress } from "@/components/ui/progress";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import {
  Tv,
  Smartphone,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Terminal,
  ChevronDown,
  Wifi,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── HTTP Examples ────────────────────────────────────────────────────────────

const DEVICE_AUTH_REQUEST = `POST /device/code HTTP/1.1
Host: oauth.example.com
Content-Type: application/x-www-form-urlencoded

client_id=tv-app-client-456&
scope=openid+profile+email`;

const DEVICE_AUTH_RESPONSE = `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://oauth.example.com/device",
  "verification_uri_complete": "https://oauth.example.com/device?user_code=WDJB-MJHT",
  "expires_in": 1800,
  "interval": 5
}`;

const POLL_REQUEST = `POST /token HTTP/1.1
Host: oauth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code&
device_code=GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS&
client_id=tv-app-client-456`;

const POLL_PENDING_RESPONSE = `HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "authorization_pending",
  "error_description": "The user has not yet approved the request."
}`;

const POLL_SUCCESS_RESPONSE = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}`;

const SLOW_DOWN_RESPONSE = `HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "slow_down",
  "error_description": "Polling too fast. Increase interval by 5 seconds."
}`;

// ─── Code Examples ────────────────────────────────────────────────────────────

const JS_EXAMPLE = `// Device Authorization Flow — Node.js

const CLIENT_ID = 'tv-app-client-456';
const TOKEN_URL = 'https://oauth.example.com/token';
const DEVICE_URL = 'https://oauth.example.com/device/code';

async function startDeviceAuth() {
  // Step 1: Request device and user codes
  const response = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'openid profile email',
    }),
  });

  const deviceAuth = await response.json();

  // Step 2: Show user code on screen
  console.log('\\n========================================');
  console.log(\`  Visit: \${deviceAuth.verification_uri}\`);
  console.log(\`  Enter code: \${deviceAuth.user_code}\`);
  console.log('========================================\\n');

  // Step 3: Poll for token
  const tokens = await pollForToken(
    deviceAuth.device_code,
    deviceAuth.interval,
    deviceAuth.expires_in
  );

  return tokens;
}

async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number
): Promise<object> {
  const deadline = Date.now() + expiresIn * 1000;
  let pollInterval = interval; // Start at recommended interval (e.g. 5s)

  while (Date.now() < deadline) {
    await sleep(pollInterval * 1000);

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCode,
        client_id: CLIENT_ID,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Success! User has authorized
      console.log('Authorization successful!');
      return data;
    }

    switch (data.error) {
      case 'authorization_pending':
        // Normal — user hasn't approved yet, keep polling
        continue;

      case 'slow_down':
        // AS requesting slower polling — add 5 seconds
        pollInterval += 5;
        console.log(\`Slowing poll interval to \${pollInterval}s\`);
        continue;

      case 'expired_token':
        throw new Error('Device code expired. Please restart the flow.');

      case 'access_denied':
        throw new Error('User denied the authorization request.');

      default:
        throw new Error(\`Unexpected error: \${data.error}\`);
    }
  }

  throw new Error('Timed out waiting for user authorization.');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}`;

const PYTHON_EXAMPLE = `# Device Authorization Flow — Python

import time
import httpx

CLIENT_ID = 'tv-app-client-456'
TOKEN_URL = 'https://oauth.example.com/token'
DEVICE_URL = 'https://oauth.example.com/device/code'

def start_device_auth():
    # Step 1: Request device and user codes
    response = httpx.post(DEVICE_URL, data={
        'client_id': CLIENT_ID,
        'scope': 'openid profile email',
    })
    response.raise_for_status()
    device_auth = response.json()

    # Step 2: Display code to user
    print(f"\\n{'='*40}")
    print(f"  Visit: {device_auth['verification_uri']}")
    print(f"  Enter code: {device_auth['user_code']}")
    print(f"{'='*40}\\n")

    # Step 3: Poll for token
    return poll_for_token(
        device_code=device_auth['device_code'],
        interval=device_auth['interval'],
        expires_in=device_auth['expires_in'],
    )

def poll_for_token(device_code: str, interval: int, expires_in: int) -> dict:
    deadline = time.time() + expires_in
    poll_interval = interval

    while time.time() < deadline:
        time.sleep(poll_interval)

        response = httpx.post(TOKEN_URL, data={
            'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',
            'device_code': device_code,
            'client_id': CLIENT_ID,
        })

        data = response.json()

        if response.status_code == 200:
            print("Authorization successful!")
            return data

        error = data.get('error')

        if error == 'authorization_pending':
            continue  # Normal — keep polling
        elif error == 'slow_down':
            poll_interval += 5  # Increase interval by 5s
            print(f"Slowing poll to {poll_interval}s")
        elif error == 'expired_token':
            raise Exception("Device code expired. Restart the flow.")
        elif error == 'access_denied':
            raise Exception("User denied the authorization request.")
        else:
            raise Exception(f"Unexpected error: {error}")

    raise Exception("Timed out waiting for user authorization.")

if __name__ == '__main__':
    tokens = start_device_auth()
    print(f"Access token: {tokens['access_token'][:30]}...")`;

const CURL_EXAMPLE = `# Device Authorization Flow — cURL

# Step 1: Request device code
curl -X POST https://oauth.example.com/device/code \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id=tv-app-client-456" \\
  -d "scope=openid profile email"

# Step 2: Show the user_code to the user on the device screen
# Example response includes:
# "user_code": "WDJB-MJHT"
# "verification_uri": "https://oauth.example.com/device"

# Step 3: Poll for the token (every 5 seconds)
DEVICE_CODE="GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS"

while true; do
  RESPONSE=$(curl -s -X POST https://oauth.example.com/token \\
    -H "Content-Type: application/x-www-form-urlencoded" \\
    -d "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code" \\
    -d "device_code=$DEVICE_CODE" \\
    -d "client_id=tv-app-client-456")

  ERROR=$(echo $RESPONSE | jq -r '.error // empty')

  if [ -z "$ERROR" ]; then
    echo "Success! Token received."
    echo $RESPONSE | jq .
    break
  elif [ "$ERROR" = "authorization_pending" ]; then
    echo "Waiting for user..."
    sleep 5
  elif [ "$ERROR" = "slow_down" ]; then
    echo "Slowing down..."
    sleep 10
  else
    echo "Error: $ERROR"
    break
  fi
done`;

// ─── Flow Steps ───────────────────────────────────────────────────────────────

const FLOW_STEPS = [
  {
    id: 1,
    title: "Request Device Code",
    channel: "Device → Auth Server",
    description: "Device POSTs client_id and scope to the device authorization endpoint.",
    color: "bg-blue-500",
    httpExamples: [
      { label: "Device Auth Request", code: DEVICE_AUTH_REQUEST, language: "http" },
      { label: "Device Auth Response", code: DEVICE_AUTH_RESPONSE, language: "json" },
    ],
  },
  {
    id: 2,
    title: "Display User Code",
    channel: "Device → User",
    description:
      'Device shows user_code (e.g., "WDJB-MJHT") and verification_uri on screen. User visits the URI on a phone or computer.',
    color: "bg-purple-500",
    httpExamples: [],
  },
  {
    id: 3,
    title: "User Authorizes",
    channel: "User → Auth Server (via browser)",
    description:
      "User enters the code at the verification_uri and authenticates. This happens on a secondary device with a browser.",
    color: "bg-green-500",
    httpExamples: [],
  },
  {
    id: 4,
    title: "Device Polls for Token",
    channel: "Device → Auth Server",
    description:
      "Device polls the token endpoint at the specified interval until success or expiry.",
    color: "bg-orange-500",
    httpExamples: [
      { label: "Poll Request", code: POLL_REQUEST, language: "http" },
      { label: "Pending Response (keep polling)", code: POLL_PENDING_RESPONSE, language: "json" },
      { label: "Slow Down Response", code: SLOW_DOWN_RESPONSE, language: "json" },
      { label: "Success Response", code: POLL_SUCCESS_RESPONSE, language: "json" },
    ],
  },
];

function FlowDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {FLOW_STEPS.map((step, idx) => (
          <div key={step.id}>
            <button
              className="w-full text-left"
              onClick={() =>
                setActiveStep(activeStep === step.id ? null : step.id)
              }
            >
              <div
                className={cn(
                  "flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                  activeStep === step.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold",
                    step.color
                  )}
                >
                  {step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{step.title}</span>
                    <span className="text-xs text-muted-foreground">{step.channel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 shrink-0 text-muted-foreground transition-transform",
                    activeStep === step.id && "rotate-180"
                  )}
                />
              </div>
            </button>
            {idx < FLOW_STEPS.length - 1 && (
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
            {FLOW_STEPS[activeStep - 1].httpExamples.length > 0 ? (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                <h4 className="font-medium text-sm">
                  Step {activeStep}: {FLOW_STEPS[activeStep - 1].title} — HTTP Details
                </h4>
                {FLOW_STEPS[activeStep - 1].httpExamples.map((ex) => (
                  <div key={ex.label}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      {ex.label}
                    </p>
                    <CodeBlock code={ex.code} language={ex.language} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  {activeStep === 2
                    ? 'This step happens on the device UI — show the user_code prominently (large font) and the verification_uri. If displaying a QR code, use the verification_uri_complete which includes the code pre-filled.'
                    : "This step happens in the user's browser on their phone or computer — it's a standard OAuth login and consent screen. No device-side HTTP call."}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-center text-muted-foreground">
        Click any step to reveal details.
      </p>
    </div>
  );
}

// ─── Polling Demo ─────────────────────────────────────────────────────────────

function PollingDemo() {
  const [polling, setPolling] = useState(false);
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "pending" | "slow_down" | "success"
  >("idle");

  useEffect(() => {
    if (!polling) return;
    const responses: ("pending" | "pending" | "slow_down" | "pending" | "success")[] = [
      "pending", "pending", "slow_down", "pending", "success"
    ];
    if (tick >= responses.length) {
      setPolling(false);
      return;
    }
    const t = setTimeout(() => {
      setStatus(responses[tick]);
      setTick((t) => t + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [polling, tick]);

  const statusColor: Record<string, string> = {
    idle: "text-muted-foreground",
    pending: "text-yellow-500",
    slow_down: "text-orange-500",
    success: "text-green-500",
  };

  const statusLabel: Record<string, string> = {
    idle: "Not started",
    pending: "authorization_pending — waiting for user...",
    slow_down: "slow_down — increasing poll interval...",
    success: "Token received! Authorization complete.",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", polling && "animate-spin text-primary")} />
            <h3 className="font-semibold text-sm">Polling Simulation</h3>
          </div>
          <button
            onClick={() => {
              setPolling(true);
              setTick(0);
              setStatus("pending");
            }}
            disabled={polling}
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {polling ? "Polling..." : "Start Demo"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={tick * 20} className="h-1.5" />
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              status === "success" ? "bg-green-500" :
              status === "slow_down" ? "bg-orange-500" :
              status === "pending" ? "bg-yellow-500 animate-pulse" :
              "bg-muted"
            )}
          />
          <span className={cn("text-sm font-medium", statusColor[status])}>
            {statusLabel[status]}
          </span>
        </div>
        <div className="space-y-1">
          {tick > 0 && (
            <div className="font-mono text-xs space-y-1">
              {Array.from({ length: tick }).map((_, i) => {
                const r = ["pending", "pending", "slow_down", "pending", "success"][i];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "px-2 py-1 rounded",
                      r === "success" ? "bg-green-500/10 text-green-400" :
                      r === "slow_down" ? "bg-orange-500/10 text-orange-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    )}
                  >
                    {`Poll ${i + 1}: ${r}`}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Header */}
        <ScrollReveal>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Smart TVs & CLIs</Badge>
              <Badge variant="info">RFC 8628</Badge>
              <Badge variant="success">OAuth 2.0</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Device Authorization Flow
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Designed for devices that cannot open a browser or have limited input capability.
              The device obtains a short code and a URL — the user visits the URL on their
              phone or computer, enters the code, and approves access while the device polls
              for the resulting token.
            </p>
          </div>
        </ScrollReveal>

        {/* Real-World Examples */}
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Terminal className="w-5 h-5" />, label: "GitHub CLI", sub: "gh auth login" },
              { icon: <Tv className="w-5 h-5" />, label: "Smart TVs", sub: "Netflix, YouTube" },
              { icon: <Wifi className="w-5 h-5" />, label: "IoT Devices", sub: "Home automation" },
              { icon: <Smartphone className="w-5 h-5" />, label: "Game Consoles", sub: "PS5, Xbox" },
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-4 text-center"
              >
                <div className="text-yellow-500">{icon}</div>
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <Separator />

        {/* Two-Channel Explanation */}
        <ScrollReveal>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Two-Channel Architecture</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-200 dark:border-blue-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-sm">Device Channel</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>The device communicates directly with the Authorization Server via HTTP (back-channel). It requests a device code, then polls for the token.</p>
                  <p>No browser required. Works on any device with internet access.</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 dark:border-green-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-sm">User Channel</h3>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>The user visits the verification_uri on a secondary device (phone, laptop) with a full browser. They log in and enter the code shown on the device.</p>
                  <p>Full OAuth login experience — supports MFA, SSO, consent.</p>
                </CardContent>
              </Card>
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
                Click each step to see HTTP request/response details.
              </p>
            </div>
            <FlowDiagram />
          </section>
        </ScrollReveal>

        <Separator />

        {/* Polling Mechanism */}
        <ScrollReveal>
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">The Polling Mechanism</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              While the user authorizes on their secondary device, the device polls the token
              endpoint at the interval specified in the device authorization response (typically
              5 seconds). The server returns error codes to control polling behavior.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              {[
                {
                  error: "authorization_pending",
                  action: "Keep polling at current interval",
                  color: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/20",
                  icon: <Clock className="w-4 h-4 text-yellow-500" />,
                },
                {
                  error: "slow_down",
                  action: "Add 5 seconds to poll interval",
                  color: "border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20",
                  icon: <RefreshCw className="w-4 h-4 text-orange-500" />,
                },
                {
                  error: "expired_token",
                  action: "Restart the entire flow",
                  color: "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20",
                  icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
                },
              ].map((item) => (
                <div key={item.error} className={cn("rounded-lg border p-3", item.color)}>
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <code className="text-xs font-bold">{item.error}</code>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.action}</p>
                </div>
              ))}
            </div>
            <PollingDemo />
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
                <CodeBlock code={JS_EXAMPLE} language="javascript" filename="device-flow.ts" />
              </TabsContent>
              <TabsContent value="python">
                <CodeBlock code={PYTHON_EXAMPLE} language="python" filename="device_flow.py" />
              </TabsContent>
              <TabsContent value="curl">
                <CodeBlock code={CURL_EXAMPLE} language="bash" filename="device-flow.sh" />
              </TabsContent>
            </Tabs>
          </section>
        </ScrollReveal>

        <Separator />

        {/* Security Notes */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Security Notes</h2>
            </div>
            <Alert variant="info">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Rate Limiting and Code Expiry</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>User codes are short-lived:</strong> Typically 15–30 minutes. Short enough to prevent brute force, long enough for the user to complete authorization.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>User codes are human-readable:</strong> 6–8 characters, uppercase, no ambiguous characters (no 0/O, 1/I). Designed to be typed on a TV remote or keyboard.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Enforce polling rate limits:</strong> Respond with slow_down if polled too fast. Exponential backoff on the device side prevents AS overload.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Device codes must be unguessable:</strong> The device_code is a high-entropy random value — unlike the human-friendly user_code, it must be cryptographically random.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>One-time use:</strong> Once the user_code is used to authorize, it must be invalidated immediately. The device_code is also invalidated after token issuance.</span>
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </section>
        </ScrollReveal>

      </div>
    </div>
  );
}
