import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pomodoro + Expenses",
  description: "Pomodoro timer with expense tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Navigation bar */}
        <nav className="flex gap-6 p-4 border-b bg-gray-50 text-gray-800">
          <Link href="/" className="font-semibold hover:text-indigo-600">
            Pomodoro
          </Link>
          <Link href="/expenses" className="font-semibold hover:text-indigo-600">
            Expenses
          </Link>
        </nav>

        {/* Page content */}
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
