import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./theme-toggle";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pomodoro + Expenses",
  description: "Pomodoro timer with expense tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen
                    bg-[var(--background)] text-[var(--foreground)]`}
      >
        {/* Apply saved theme ASAP to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var saved = localStorage.getItem('theme');
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var t = saved || (sysDark ? 'dark' : 'light');
    var html = document.documentElement;
    html.setAttribute('data-theme', t);
    if (t === 'dark') html.classList.add('dark'); else html.classList.remove('dark');
  } catch(e){}
})();
`,
          }}
        />

        {/* Top nav */}
  <nav className="sticky top-0 z-50 border-b border-[var(--foreground)]/10 bg-[var(--background)]/70 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold hover:opacity-80">Pomodoro</Link>
            <Link href="/expenses" className="font-semibold hover:opacity-80">Expenses</Link>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Page content */}
  <main className="mx-auto max-w-6xl px-4 py-6 bg-[var(--background)] text-[var(--foreground)]">{children}</main>
      </body>
    </html>
  );
}
