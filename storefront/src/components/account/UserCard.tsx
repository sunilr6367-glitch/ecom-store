'use client';

import Link from 'next/link';
import { User } from 'lucide-react';

interface UserCardProps {
  firstName: string;
  lastName: string;
  email: string;
}

export function UserCard({ firstName, lastName, email }: UserCardProps) {
  const initials =
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="bg-surface-paper p-6 border-b border-border-subtle">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-surface-soft rounded-full flex items-center justify-center shrink-0">
          {initials ? (
            <span className="text-body-xl font-medium text-secondary">
              {initials}
            </span>
          ) : (
            <User size={24} className="text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-primary truncate">
            {firstName} {lastName}
          </p>
          <p className="text-body-sm text-muted truncate">{email}</p>
        </div>
        <Link
          href="/account/profile"
          className="p-2 text-muted hover:text-primary transition-colors"
          aria-label="Edit profile"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

