'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  getDashboardMode,
  getNavGroupsForMode,
  isNavItemActive,
  type NavGroup,
  type NavItem,
} from '@/components/layout/navigation';

export default function Sidebar({
  pendingOrders,
  isOpen,
  onClose,
}: {
  pendingOrders: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const mode = getDashboardMode(pathname);
  const navGroups = getNavGroupsForMode(mode);

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ md) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] bg-[#01071c] text-white md:flex md:flex-col">
        <SidebarContent
          user={user}
          pathname={pathname}
          mode={mode}
          pendingOrders={pendingOrders}
          groups={navGroups}
          onClose={onClose}
          logout={logout}
          showClose={false}
        />
      </aside>

      {/* ── Mobile drawer (slides in) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-[280px] bg-[#01071c] text-white flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          user={user}
          pathname={pathname}
          mode={mode}
          pendingOrders={pendingOrders}
          groups={navGroups}
          onClose={onClose}
          logout={logout}
          showClose
        />
      </aside>
    </>
  );
}

function SidebarContent({
  user,
  pathname,
  mode,
  pendingOrders,
  groups,
  onClose,
  logout,
  showClose,
}: {
  user: { first_name?: string; email?: string; role?: string } | null;
  pathname: string;
  mode: 'retail' | 'wholesale';
  pendingOrders: number;
  groups: NavGroup[];
  onClose: () => void;
  logout: () => void;
  showClose: boolean;
}) {
  const initial =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'K';

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-container-lowest)] flex items-center justify-center text-[var(--primary)] font-bold text-sm">
            {initial}
          </div>
          <div>
            <span className="block font-['Inter'] uppercase tracking-widest text-[0.6875rem] font-bold text-white leading-none">
              {mode === 'wholesale' ? 'Odhvica Wholesale' : 'Odhvica Admin'}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5 capitalize">
              {user?.role || 'Super User'}
            </span>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {groups.map((group, index) => {
          const isGroupActive = group.items.some((item) =>
            isNavItemActive(pathname, item.href)
          );

          return (
            <details
              key={group.label}
              open={index === 0 || isGroupActive}
              className="group/nav"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-300 [&::-webkit-details-marker]:hidden">
                <span>{group.label}</span>
                <ChevronDown
                  size={14}
                  className="transition-transform group-open/nav:rotate-180"
                />
              </summary>

              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    pendingOrders={pendingOrders}
                    onClose={onClose}
                  />
                ))}
              </div>
            </details>
          );
        })}

        <div className="h-px bg-white/10 my-4 mx-8" />

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-8 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className="font-['Inter'] uppercase tracking-widest text-[0.6875rem]">
            Logout
          </span>
        </button>
      </nav>
    </>
  );
}

function SidebarLink({
  item,
  pathname,
  pendingOrders,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  pendingOrders: number;
  onClose: () => void;
}) {
  const active = isNavItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex items-center gap-3 py-2.5 transition-all ${
        active
          ? 'bg-[var(--surface-container-lowest)] text-[var(--primary)] rounded-l-full ml-4 pl-4 font-bold'
          : 'text-slate-400 hover:text-white px-8 hover:bg-white/5'
      }`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="font-['Inter'] uppercase tracking-widest text-[0.6875rem] truncate">
        {item.label}
      </span>
      {item.badge === 'pendingOrders' && pendingOrders > 0 && (
        <span className="ml-auto rounded-full bg-[var(--error)] px-2 py-0.5 text-[9px] font-bold text-white">
          {pendingOrders > 99 ? '99+' : pendingOrders}
        </span>
      )}
    </Link>
  );
}
