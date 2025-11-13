'use client';

/**
 * Navbar Component
 * Main navigation bar for the application
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Home, MessageSquare, Settings, Server, Bug } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("common.navigation");

  const navItems = [
    { href: "/", label: t("dashboard"), icon: Home },
    { href: "/chat", label: t("chat"), icon: MessageSquare },
    { href: "/developer", label: t("developer"), icon: Bug },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl">
            <Server className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden xs:inline sm:inline">MCP Hub</span>
          </Link>

          {/* Navigation links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-1 sm:gap-2',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

