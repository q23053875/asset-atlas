import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Asset Atlas", description: "Personal investment intelligence" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-Hant" suppressHydrationWarning><body>{children}</body></html>; }
