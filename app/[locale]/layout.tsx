import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "../../i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { ShortcutsHelp } from "@/components/layout/shortcuts-help";
import { CleanupHandler } from "@/components/layout/cleanup-handler";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { BreadcrumbProvider } from "@/components/layout/breadcrumb-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import "../globals.css";
import { ThemeProvider } from "next-themes";
import { ThemeBridge } from "@/components/layout/theme-bridge";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const geistSans = {
  variable: "--font-geist-sans",
  className: "",
};

const geistMono = {
  variable: "--font-geist-mono",
  className: "",
};

export function generateStaticParams() {
  return routing.locales.map((locale: string) => ({ locale })) satisfies Array<{ locale: string }>;
}

type LayoutParams = { locale: string };

type LayoutProps = {
  children: ReactNode;
  params: Promise<LayoutParams>;
};

export async function generateMetadata({ params }: { params: Promise<LayoutParams> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const common = await getTranslations({ locale, namespace: "common" });

  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CommandPaletteProvider>
            <BreadcrumbProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <SiteHeader />
                  <ErrorBoundary
                    fallbackTitle={common("errors.sectionFallback")}
                    fallbackMessage={common("errors.sectionFallbackMessage")}
                    retryLabel={common("actions.retry")}
                  >
                    <main className="flex flex-1 flex-col">{children}</main>
                  </ErrorBoundary>
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
      </NextIntlClientProvider>
    </div>
  );
}
