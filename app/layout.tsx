import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saathi (साथी) | Plain-Language Official Letter Explainer",
  description:
    "Understand confusing official letters, notices, and bank communications in plain language. Clear deadlines, document checklists, and zero data storage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
