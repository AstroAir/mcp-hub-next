import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { CleanupHandler } from "@/components/layout/cleanup-handler";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { BreadcrumbProvider } from "@/components/layout/breadcrumb-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
          <BreadcrumbProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <SiteHeader />
                <main className="flex flex-1 flex-col">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
            <KeyboardShortcuts />
            <CleanupHandler />
          </BreadcrumbProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
