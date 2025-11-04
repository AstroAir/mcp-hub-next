import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { ShortcutsHelp } from "@/components/layout/shortcuts-help";
import { CleanupHandler } from "@/components/layout/cleanup-handler";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { BreadcrumbProvider } from "@/components/layout/breadcrumb-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ThemeBridge } from "@/components/layout/theme-bridge";

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
  // Apply theme class on body based on settings store
  // Note: RootLayout is a server component; inject a client sub-tree for ThemeProvider
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
              <ShortcutsHelp />
              <ThemeBridge />
              <CleanupHandler />
            </BreadcrumbProvider>
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
