"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  Key,
  Link2,
  Fingerprint,
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

// ─── Code examples ─────────────────────────────────────────────────────────

const swiftAppAuthCode = `// iOS Swift — AppAuth-iOS library
// Install: https://github.com/openid/AppAuth-iOS
// Swift Package: https://github.com/openid/AppAuth-iOS.git

import AppAuth

class AuthManager {
    // Store the auth state — handles token refresh automatically
    var authState: OIDAuthState?

    func startLogin(presentingViewController: UIViewController) {
        // 1. Discover authorization server configuration
        let issuerURL = URL(string: "https://auth.example.com")!

        OIDAuthorizationService.discoverConfiguration(forIssuer: issuerURL) { config, error in
            guard let config = config else {
                print("Discovery error: \\(error?.localizedDescription ?? "Unknown")")
                return
            }

            // 2. Build the authorization request (PKCE is automatic with AppAuth)
            let request = OIDAuthorizationRequest(
                configuration: config,
                clientId: "YOUR_CLIENT_ID",
                clientSecret: nil,          // Public client — no secret
                scopes: [OIDScopeOpenID, OIDScopeProfile, "email"],
                redirectURL: URL(string: "com.yourapp://callback")!,
                responseType: OIDResponseTypeCode,
                additionalParameters: nil
            )

            // 3. Perform the authorization request
            // AppAuth opens an ASWebAuthenticationSession (not a WebView!)
            let appDelegate = UIApplication.shared.delegate as! AppDelegate
            appDelegate.currentAuthorizationFlow =
                OIDAuthState.authState(byPresenting: request,
                                       presenting: presentingViewController) { authState, error in
                    if let authState = authState {
                        self.authState = authState
                        self.saveAuthState()
                        print("Access token: \\(authState.lastTokenResponse?.accessToken ?? "")")
                    } else {
                        print("Auth error: \\(error?.localizedDescription ?? "Unknown")")
                    }
                }
        }
    }

    // 4. Make an authenticated API call (AppAuth handles refresh automatically)
    func fetchUserProfile(completion: @escaping (Data?, Error?) -> Void) {
        authState?.performAction { accessToken, idToken, error in
            guard let accessToken = accessToken else {
                completion(nil, error)
                return
            }

            var request = URLRequest(url: URL(string: "https://api.example.com/me")!)
            request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization")

            URLSession.shared.dataTask(with: request) { data, _, error in
                completion(data, error)
            }.resume()
        }
    }

    // 5. Persist auth state to Keychain
    func saveAuthState() {
        guard let authState = authState else { return }
        let data = try? NSKeyedArchiver.archivedData(
            withRootObject: authState,
            requiringSecureCoding: true
        )
        // Store 'data' in Keychain (see KeychainHelper below)
        KeychainHelper.save(data: data!, key: "oauth_auth_state")
    }

    // 6. Restore auth state from Keychain on app launch
    func restoreAuthState() {
        guard let data = KeychainHelper.load(key: "oauth_auth_state"),
              let state = try? NSKeyedUnarchiver.unarchivedObject(
                  ofClass: OIDAuthState.self, from: data
              ) else { return }
        authState = state
    }
}`;

const swiftKeychainCode = `// iOS Swift — Secure Keychain storage helper
// NEVER use UserDefaults for tokens — use Keychain

import Security
import Foundation

struct KeychainHelper {

    // Save data to Keychain
    @discardableResult
    static func save(data: Data, key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String:           kSecClassGenericPassword,
            kSecAttrAccount as String:     key,
            kSecValueData as String:       data,
            // Restrict access: only available when device is unlocked
            kSecAttrAccessible as String:  kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]

        // Delete existing item first
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    // Load data from Keychain
    static func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String:  true,
            kSecMatchLimit as String:  kSecMatchLimitOne,
        ]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        return status == errSecSuccess ? dataTypeRef as? Data : nil
    }

    // Delete item from Keychain
    @discardableResult
    static func delete(key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrAccount as String: key,
        ]
        return SecItemDelete(query as CFDictionary) == errSecSuccess
    }
}

// ── Biometric authentication gate ────────────────────────────
// Require Face ID / Touch ID before returning stored tokens

import LocalAuthentication

func authenticateWithBiometrics(completion: @escaping (Bool, Error?) -> Void) {
    let context = LAContext()
    var error: NSError?

    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                                    error: &error) else {
        completion(false, error)
        return
    }

    context.evaluatePolicy(
        .deviceOwnerAuthenticationWithBiometrics,
        localizedReason: "Authenticate to access your account"
    ) { success, authError in
        DispatchQueue.main.async {
            completion(success, authError)
        }
    }
}`;

const kotlinAppAuthCode = `// Android Kotlin — AppAuth-Android library
// Gradle: implementation("net.openid:appauth:0.11.1")

import net.openid.appauth.*
import android.content.Intent

class AuthManager(private val context: Context) {

    private val authService = AuthorizationService(context)

    // 1. Discover OIDC configuration and start authorization
    fun startLogin(activity: Activity, requestCode: Int) {
        val serviceConfig = AuthorizationServiceConfiguration(
            Uri.parse("https://auth.example.com/authorize"),    // auth endpoint
            Uri.parse("https://auth.example.com/token")         // token endpoint
            // Or use discovery: AuthorizationServiceConfiguration.fetchFromIssuer(...)
        )

        // AppAuth generates PKCE code_verifier and code_challenge automatically
        val authRequest = AuthorizationRequest.Builder(
            serviceConfig,
            "YOUR_CLIENT_ID",
            ResponseTypeValues.CODE,
            Uri.parse("com.yourapp://callback")  // registered in AndroidManifest.xml
        )
            .setScopes("openid", "profile", "email")
            .build()

        val authIntent = authService.getAuthorizationRequestIntent(authRequest)
        activity.startActivityForResult(authIntent, requestCode)
    }

    // 2. Handle the redirect back from the browser
    fun handleAuthResponse(intent: Intent, callback: (AuthState?, Exception?) -> Unit) {
        val response = AuthorizationResponse.fromIntent(intent)
        val error    = AuthorizationException.fromIntent(intent)

        val authState = AuthState(response, error)

        if (response != null) {
            // 3. Exchange authorization code for tokens
            val tokenRequest = response.createTokenExchangeRequest()

            authService.performTokenRequest(tokenRequest) { tokenResponse, tokenException ->
                authState.update(tokenResponse, tokenException)

                if (tokenResponse != null) {
                    saveAuthState(authState) // Persist to EncryptedSharedPreferences
                    callback(authState, null)
                } else {
                    callback(null, tokenException)
                }
            }
        } else {
            callback(null, error)
        }
    }

    // 4. Make an authenticated API call (AppAuth handles refresh)
    fun fetchUserProfile(authState: AuthState, callback: (String?, Exception?) -> Unit) {
        authState.performActionWithFreshTokens(authService) { accessToken, _, exception ->
            if (exception != null) {
                callback(null, exception)
                return@performActionWithFreshTokens
            }

            // Run network call on IO dispatcher in production
            val url = URL("https://api.example.com/me")
            with(url.openConnection() as HttpURLConnection) {
                setRequestProperty("Authorization", "Bearer \$accessToken")
                val response = inputStream.bufferedReader().readText()
                callback(response, null)
            }
        }
    }

    // 5. Persist to Android Keystore via EncryptedSharedPreferences
    private fun saveAuthState(authState: AuthState) {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        val prefs = EncryptedSharedPreferences.create(
            context,
            "secure_auth_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        prefs.edit()
            .putString("auth_state", authState.jsonSerializeString())
            .apply()
    }
}`;

const deepLinkManifestCode = `<!-- AndroidManifest.xml — Register custom URI scheme and App Links -->

<!-- Option A: Custom URI Scheme (simpler, less secure) -->
<activity android:name=".CallbackActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <!-- com.yourapp://callback -->
    <data
      android:scheme="com.yourapp"
      android:host="callback" />
  </intent-filter>
</activity>

<!-- Option B: App Links (preferred — requires HTTPS + assetlinks.json) -->
<activity android:name=".CallbackActivity">
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <!-- https://yourapp.com/callback -->
    <data
      android:scheme="https"
      android:host="yourapp.com"
      android:pathPrefix="/callback" />
  </intent-filter>
</activity>

<!--
  For App Links, host /.well-known/assetlinks.json on yourapp.com:
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourapp",
      "sha256_cert_fingerprints": ["YOUR_APP_SIGNING_CERT_SHA256"]
    }
  }]
-->`;

// ─── Main page ─────────────────────────────────────────────────────────────

export default function MobilePathPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/paths" className="hover:text-foreground transition-colors">Learning Paths</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Mobile Developer</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">Mobile Developer Path</h1>
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            Intermediate
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          OAuth for iOS and Android has specific requirements and best practices that differ from web apps.
          This path covers PKCE implementation, secure storage, Universal Links, and biometric authentication.
        </p>
      </div>

      {/* ── Section 1: Why PKCE is mandatory ─────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">1. Why PKCE is Mandatory for Mobile</h2>

          <Alert className="mb-4">
            <Info className="w-4 h-4" />
            <AlertTitle>RFC 8252 — OAuth 2.0 for Native Apps</AlertTitle>
            <AlertDescription>
              RFC 8252 specifically addresses OAuth for native mobile apps. Key mandates: use PKCE, use
              system browsers (not embedded WebViews), and use Universal Links or App Links for redirect URIs.
              PKCE is required because mobile apps are public clients that cannot safely store a client_secret.
            </AlertDescription>
          </Alert>

          <StaggerReveal className="grid gap-4 sm:grid-cols-2">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm">Why No Client Secret?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Mobile apps are distributed as compiled binaries. Any secret embedded in the app binary
                  can be extracted by anyone who downloads the app. Tools like strings, Frida, and jadx can
                  trivially recover hardcoded credentials.
                </p>
                <p>
                  PKCE solves this: instead of a shared secret, each authorization request uses a unique
                  cryptographic challenge that is generated fresh and valid only once.
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm">Avoid Embedded WebViews</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Never use an embedded WKWebView (iOS) or WebView (Android) for the authorization UI. The
                  host app can inspect and intercept everything that happens in a WebView — including the
                  user's password.
                </p>
                <p>
                  Use ASWebAuthenticationSession (iOS 12+) or Chrome Custom Tabs (Android). These run in
                  an isolated browser context that your app cannot read.
                </p>
              </CardContent>
            </Card>
          </StaggerReveal>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 2: AppAuth Library ──────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">2. AppAuth Library</h2>
          <p className="text-muted-foreground text-sm mb-4">
            AppAuth is the OAuth/OIDC SDK endorsed by the OpenID Foundation for mobile apps. It handles
            PKCE generation, system browser integration, token exchange, and automatic token refresh. Use it
            rather than implementing the flow manually.
          </p>

          <Tabs defaultValue="ios">
            <TabsList className="mb-4">
              <TabsTrigger value="ios">iOS (Swift)</TabsTrigger>
              <TabsTrigger value="android">Android (Kotlin)</TabsTrigger>
            </TabsList>

            <TabsContent value="ios">
              <CodeBlock code={swiftAppAuthCode} language="typescript" filename="AuthManager.swift" />
            </TabsContent>

            <TabsContent value="android">
              <CodeBlock code={kotlinAppAuthCode} language="typescript" filename="AuthManager.kt" />
            </TabsContent>
          </Tabs>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 3: Token Storage ─────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">3. Secure Token Storage</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Mobile operating systems provide hardware-backed secure storage that is far superior to any
            file-based storage. Always use platform-specific secure storage APIs.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">iOS — Keychain Services</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  The iOS Keychain is a secure, encrypted database managed by the OS. Items are protected by
                  the Secure Enclave on modern devices. Access can be restricted to require biometric
                  authentication.
                </p>
                <div className="space-y-1">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Use <code className="bg-muted px-1 rounded">kSecAttrAccessibleWhenUnlockedThisDeviceOnly</code></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Add biometric protection with <code className="bg-muted px-1 rounded">LAContext</code></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Never store tokens in <code className="bg-muted px-1 rounded">UserDefaults</code></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Never write tokens to the app's sandbox filesystem</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Android — Keystore + EncryptedSharedPrefs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>
                  Android provides the Android Keystore system for hardware-backed key storage and
                  EncryptedSharedPreferences for encrypted data at rest. Keys generated in the Keystore never
                  leave the secure hardware.
                </p>
                <div className="space-y-1">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Use <code className="bg-muted px-1 rounded">EncryptedSharedPreferences</code> from Jetpack Security</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Use AES256-GCM key scheme via <code className="bg-muted px-1 rounded">MasterKey</code></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Never use <code className="bg-muted px-1 rounded">SharedPreferences</code> (unencrypted)</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>Never store in plain SQLite or external storage</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <CodeBlock code={swiftKeychainCode} language="typescript" filename="KeychainHelper.swift" />
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 4: Redirect URI Schemes ──────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">4. Custom URI Schemes vs Universal Links / App Links</h2>
          <p className="text-muted-foreground text-sm mb-4">
            The redirect_uri in a mobile OAuth flow must route back to your app after authorization. There
            are two mechanisms, with very different security properties.
          </p>

          <Accordion type="single" collapsible className="space-y-2 mb-4">
            <AccordionItem value="custom-scheme" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Link2 className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Custom URI Scheme (com.yourapp://)</span>
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-900 dark:border-amber-700 dark:text-amber-400">Acceptable</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  Custom schemes like <code className="bg-muted px-1 rounded text-xs">com.yourapp://callback</code> are handled by
                  the OS which routes the URL to your registered app. They work on both iOS and Android
                  without server-side configuration.
                </p>
                <div className="bg-muted/40 rounded border p-3 space-y-1">
                  <p className="font-medium text-foreground text-xs">Security Risk: Scheme Hijacking</p>
                  <p className="text-xs">
                    Any app on the device can register the same custom scheme. On Android especially, multiple
                    apps can claim the same scheme, and the OS may show a disambiguation dialog — or silently
                    deliver the authorization code to a malicious app. PKCE mitigates this: a stolen code
                    cannot be used without the code_verifier. Still, prefer Universal Links when possible.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="universal-links" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Link2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Universal Links (iOS) / App Links (Android)</span>
                  <Badge className="text-xs bg-emerald-500 text-white">Recommended</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-2 text-sm text-muted-foreground">
                <p>
                  Universal Links (iOS) and App Links (Android) use HTTPS URLs like
                  <code className="bg-muted px-1 rounded text-xs">https://yourapp.com/callback</code>. The OS
                  validates a signed JSON file (<code className="text-xs">apple-app-site-association</code> /
                  <code className="text-xs">assetlinks.json</code>) hosted on your domain to confirm only
                  your app can handle those URLs.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded p-3 space-y-1">
                  <p className="font-medium text-foreground text-xs">Why It Is Safer</p>
                  <p className="text-xs">
                    Because the association is verified via your HTTPS domain, no other app can claim your
                    redirect URI. This eliminates the scheme-hijacking attack entirely. The tradeoff is you
                    need server-side configuration (hosting the association file).
                  </p>
                </div>
                <CodeBlock code={deepLinkManifestCode} language="bash" filename="AndroidManifest.xml" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 5: Biometric Auth ─────────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">5. Biometric Authentication Integration</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Biometric authentication (Face ID, Touch ID, fingerprint) can be layered on top of OAuth tokens
            to provide a second layer of protection. It does not replace OAuth — it gates access to the stored
            tokens.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Pattern 1: Token Access Gate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  Require biometric authentication before reading tokens from secure storage. Even if the
                  device is compromised and Keychain/Keystore can be read, the attacker must also pass
                  biometric verification.
                </p>
                <p>
                  Use <code className="bg-muted px-1 rounded">kSecAccessControlBiometryCurrentSet</code> on
                  iOS or <code className="bg-muted px-1 rounded">BiometricPrompt</code> guarding the
                  EncryptedSharedPreferences key on Android.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Pattern 2: Re-authentication for Sensitive Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>
                  For high-value operations (transfers, account changes), require biometric re-authentication
                  even if the user is already logged in. The server can require a fresh token with an
                  <code className="bg-muted px-1 rounded">acr_values=biometric</code> claim.
                </p>
                <p>
                  Combine with a short-lived (5 min) access token scoped to the sensitive operation.
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Biometrics Are a Convenience Layer</AlertTitle>
            <AlertDescription>
              Biometrics authenticate that someone is physically present and has the device. They do not
              cryptographically prove identity to the server. Always ensure the OAuth token is still valid
              server-side. Do not use biometrics as a substitute for token validation — they work together.
            </AlertDescription>
          </Alert>
        </section>
      </ScrollReveal>

      <Separator className="mb-10" />

      {/* ── Section 6: Security Checklist ─────────────────────── */}
      <ScrollReveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">6. Mobile OAuth Security Checklist</h2>
          <div className="space-y-2">
            {[
              { ok: true, item: "Using AppAuth or equivalent (not a custom flow implementation)" },
              { ok: true, item: "PKCE enabled with S256 method (not plain)" },
              { ok: true, item: "System browser (ASWebAuthenticationSession / Chrome Custom Tabs), not embedded WebView" },
              { ok: true, item: "Tokens stored in Keychain (iOS) or EncryptedSharedPreferences with Keystore key (Android)" },
              { ok: true, item: "Access tokens NOT stored in UserDefaults, SharedPreferences, or filesystem" },
              { ok: true, item: "Universal Links / App Links preferred over custom URI schemes" },
              { ok: true, item: "Authorization server validates exact redirect_uri (no wildcards)" },
              { ok: true, item: "State parameter used and validated to prevent CSRF" },
              { ok: true, item: "Refresh token rotation enabled on the authorization server" },
              { ok: true, item: "Certificate pinning considered for high-security apps" },
              { ok: false, item: "Hardcoded client_secret in mobile app binary — never do this" },
              { ok: false, item: "Logging access tokens or refresh tokens to console or crash reporters" },
              { ok: false, item: "Using response_type=token (Implicit flow) — deprecated and insecure" },
            ].map((row, i) => (
              <div key={i} className={`flex items-start gap-2.5 rounded-md px-3 py-2 text-sm ${
                row.ok ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20"
              }`}>
                {row.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                )}
                <span className={row.ok ? "text-foreground" : "text-destructive"}>{row.item}</span>
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
              <Key className="w-5 h-5 text-primary" />
              <span className="font-semibold">Continue Your Learning</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Mobile apps are attractive attack targets because users carry them everywhere. Deepen your
              security knowledge with the Security Specialist path.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/paths/security">Security Specialist Path</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/flows/authorization-code">Auth Code + PKCE Flow</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/checklist">Security Checklist</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
