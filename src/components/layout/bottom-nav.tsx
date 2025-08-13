'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Home, Heart, Clock, Settings } from 'lucide-react';

interface Badges {
  pets?: number;
  history?: number;
  settings?: boolean; // show red dot when true
}

export default function BottomNav({ badges }: { badges?: Badges }) {
  const pathname = usePathname();
  const isScanActive = pathname.startsWith('/camera');

  const tabs = [
    {
      href: '/settings',
      label: 'تنظیمات',
      icon: Settings,
      aria: 'تنظیمات برنامه',
      badge: badges?.settings ? 'dot' : undefined,
    },
    {
      href: '/history',
      label: 'تاریخچه',
      icon: Clock,
      aria: 'تاریخچه تحلیل‌ها',
      badge:
        badges?.history && badges.history > 0
          ? String(Math.min(99, badges.history))
          : undefined,
    },
    // Center scan handled separately
    {
      href: '/pets',
      label: 'حیوانات',
      icon: Heart,
      aria: 'مدیریت حیوانات خانگی',
      badge:
        badges?.pets && badges.pets > 0
          ? String(Math.min(99, badges.pets))
          : undefined,
    },
    { href: '/', label: 'خانه', icon: Home, aria: 'خانه', badge: undefined },
  ] as const;

  return (
    <nav
      dir="rtl"
      aria-label="ناوبری پایین"
      className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden"
      role="navigation"
    >
      {/* Safe area support */}
      <div
        className="h-20 relative"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Grid container for 5 columns (with center slot for FAB) */}
        <ul className="grid grid-cols-5 h-full items-center text-center">
          {/* RTL order: Settings | History | [Scan] | Pets | Home */}
          {tabs.slice(0, 2).map(({ href, label, icon: Icon, aria, badge }) => {
            const isActive =
              pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={href} className="h-full">
                <Link
                  href={href}
                  className={`transition-all duration-200 mx-1 inline-flex h-full flex-col items-center justify-center gap-1 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  aria-label={aria + (isActive ? '، برگه فعال' : '')}
                >
                  <div className="relative">
                    <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                    {badge &&
                      (badge === 'dot' ? (
                        <span
                          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-error-500 ring-2 ring-background"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] rounded-full bg-error-500 text-[10px] leading-[18px] px-1 text-white font-bold ring-2 ring-background">
                          {badge}
                        </span>
                      ))}
                  </div>
                  <span className="text-[12px] leading-4">{label}</span>
                </Link>
              </li>
            );
          })}

          {/* Center slot kept empty (FAB overlays) */}
          <li aria-hidden className="h-full" />

          {tabs.slice(2).map(({ href, label, icon: Icon, aria, badge }) => {
            const isActive =
              pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={href} className="h-full">
                <Link
                  href={href}
                  className={`transition-all duration-200 mx-1 inline-flex h-full flex-col items-center justify-center gap-1 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  aria-label={aria + (isActive ? '، برگه فعال' : '')}
                >
                  <div className="relative">
                    <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                    {badge &&
                      (badge === 'dot' ? (
                        <span
                          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-error-500 ring-2 ring-background"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] rounded-full bg-error-500 text-[10px] leading-[18px] px-1 text-white font-bold ring-2 ring-background">
                          {badge}
                        </span>
                      ))}
                  </div>
                  <span className="text-[12px] leading-4">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Elevated center Scan button */}
        <Link
          href="/camera"
          aria-label="اسکن غذای حیوان خانگی"
          className={`absolute left-1/2 -translate-x-1/2 -top-6 rounded-full border-4 border-background shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
            isScanActive
              ? 'bg-primary-500 text-white'
              : 'bg-primary-500 text-white'
          } ${isScanActive ? '' : 'animate-pulse'}`}
        >
          <div className="size-14 grid place-items-center">
            <Camera className="h-7 w-7" aria-hidden="true" />
          </div>
        </Link>
      </div>
    </nav>
  );
}
