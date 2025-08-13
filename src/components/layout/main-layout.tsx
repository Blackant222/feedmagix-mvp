'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'داشبورد',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
        />
      </svg>
    ),
  },
  {
    href: '/scan',
    label: 'اسکن غذا',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    href: '/pets',
    label: 'حیوانات خانگی',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'تاریخچه',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'پروفایل',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export function MainLayout({
  children,
  showNavigation = true,
}: MainLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-primary" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border-light bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href={showNavigation ? '/dashboard' : '/'}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold text-text-primary persian-heading">
                فیدمجیکس
              </span>
            </Link>

            {/* Desktop Navigation */}
            {showNavigation && (
              <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-colors persian-body',
                      pathname === item.href
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="bg-error-500 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            )}

            {/* Mobile Menu Button */}
            {showNavigation && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {showNavigation && isMobileMenuOpen && (
          <div className="md:hidden border-t border-border-light bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 space-x-reverse px-3 py-3 rounded-lg text-sm font-medium transition-colors persian-body',
                    pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-error-500 text-white text-xs rounded-full px-2 py-0.5 mr-auto">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Bottom Navigation for Mobile */}
      {showNavigation && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <Card
            variant="glass"
            className="rounded-none border-t border-l-0 border-r-0 border-b-0"
          >
            <nav className="flex items-center justify-around py-2">
              {navigationItems.slice(0, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors persian-body min-w-0',
                    pathname === item.href
                      ? 'text-primary-700'
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>
          </Card>
        </div>
      )}
    </div>
  );
}
