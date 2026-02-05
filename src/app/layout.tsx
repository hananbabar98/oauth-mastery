import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: {
    default: "OAuth Mastery — Complete Interactive Guide to OAuth 2.0/2.1",
    template: "%s | OAuth Mastery",
  },
  description:
    "Master OAuth 2.0 and OAuth 2.1 from beginner to production-ready expert. Interactive flow diagrams, token inspector, decision trees, security checklists, and comprehensive guides.",
  keywords: ["OAuth 2.0", "OAuth 2.1", "PKCE", "authorization code flow", "JWT", "token", "security", "authentication"],
  openGraph: {
    type: "website",
    siteName: "OAuth Mastery",
    title: "OAuth Mastery — Complete Interactive Guide to OAuth 2.0/2.1",
    description: "Master OAuth from beginner to expert with interactive diagrams, code playgrounds, and security checklists.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OAuth Mastery",
    description: "The complete interactive guide to OAuth 2.0/2.1",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const dark = localStorage.getItem('theme') === 'dark' ||
                  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased min-h-screen`}>
        <TooltipProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto flex flex-col">
                <div className="flex-1">{children}</div>
                <footer className="border-t bg-muted/30 px-6 py-4 mt-8">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span>Built by</span>
                    <a
                      href="https://www.linkedin.com/in/abdul-hanan-babar-b37811142/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Abdul Hanan Babar
                    </a>
                    <span>· © 2026</span>
                  </div>
                  <a
                    href="https://github.com/hananbabar98/oauth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                    </svg>
                    <span className="text-xs">If this helped you, a ⭐ star on GitHub would mean a lot!</span>
                  </a>
                </div>
              </footer>
              </main>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
