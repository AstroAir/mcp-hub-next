import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { CleanupHandler } from "@/components/layout/cleanup-handler";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import "./globals.css";

// Use system fonts as fallback when Google Fonts are unavailable
const geistSans = {
  variable: "--font-geist-sans",
  className: "",
};

const geistMono = {
  variable: "--font-geist-mono",
  className: "",
};

export const metadata: Metadata = {
  title: "MCP Server Hub",
  description: "Manage your Model Context Protocol servers",
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
        <CommandPaletteProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Toaster />
          <KeyboardShortcuts />
          <CleanupHandler />
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
