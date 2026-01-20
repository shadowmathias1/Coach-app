'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Sidebar({ items, header, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Header */}
      {header && (
        <div className="px-4 py-6 border-b border-border">
          {header}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                isActive ? 'sidebar-item-active' : 'sidebar-item'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-6 border-t border-border">
          {footer}
        </div>
      )}
    </aside>
  );
}