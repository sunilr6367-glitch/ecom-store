'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, Bell, LogOut, ChevronRight, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/design-system';
import { RegionSelector } from '@/components/region/RegionSelector';

export function SettingsList() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    {
      href: '/account/profile',
      icon: User,
      label: 'Edit Profile',
      active: pathname === '/account/profile',
    },
    {
      href: '/account/addresses',
      icon: MapPin,
      label: 'Saved Addresses',
      active: pathname === '/account/addresses',
    },
    {
      href: '/account/messages',
      icon: MessageCircle,
      label: 'Messages',
      active: pathname.startsWith('/account/messages'),
    },
    {
      href: '/account/notifications',
      icon: Bell,
      label: 'Notifications',
      active: pathname === '/account/notifications',
    },
  ];

  return (
    <div className="bg-surface-paper">
      <div className="p-4">
        <h2 className="text-body-xs font-bold  tracking-token-wider text-muted mb-3">
          Account Settings
        </h2>
      </div>

      <div className="border-t border-border-subtle">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              key={item.label}
              className={`flex items-center justify-between p-4 border-b border-border-subtle last:border-b-0 ${
                item.active ? 'bg-parchment' : 'hover:bg-parchment'
              } transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-muted" />
                <span className="text-body-sm font-medium text-secondary">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight size={16} className="text-muted" />
              </div>
            </div>
          );

          return (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          );
        })}
        <div className="border-b border-border-subtle p-4">
          <RegionSelector />
        </div>
      </div>

      <div className="p-4 mt-2">
        <Button
          type="button"
          onClick={logout}
          variant="ghost"
          size="md"
          fullWidth
          className="justify-between border border-danger bg-danger-bg p-4 normal-case hover:bg-danger-bg"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-error" />
            <span className="text-body-sm font-medium text-error">Sign Out</span>
          </div>
          <ChevronRight size={16} className="text-error" />
        </Button>
      </div>
    </div>
  );
}
