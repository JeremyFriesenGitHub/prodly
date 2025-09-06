import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./nav-bar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pomodoro + Expenses",
  description: "Pomodoro timer with expense tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}>
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

  <NavBar />

    {/* Page content - full width so landing backgrounds can stretch */}
  <main className="w-full min-h-screen bg-[var(--background)] text-[var(--foreground)]">{children}</main>
      </body>
    </html>
  );
}

// NavBar moved to client component file ./nav-bar.tsx
