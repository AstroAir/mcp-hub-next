"use client"

/**
 * Site Header Component
 * Fixed header bar with sidebar trigger and breadcrumbs
 */

import Link from 'next/link';
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const { items } = useBreadcrumbs();

  return (
    <header className="sticky top-0 z-50 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4 hidden sm:block"
      />
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground overflow-x-auto scrollbar-hide">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Link>

          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors whitespace-nowrap max-w-[120px] md:max-w-none truncate md:overflow-visible"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium whitespace-nowrap max-w-[120px] md:max-w-none truncate md:overflow-visible">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  )
}

