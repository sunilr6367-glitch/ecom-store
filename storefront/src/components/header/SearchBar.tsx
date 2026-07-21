'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { IconButton, Input } from '@/design-system';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 44 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden border-t border-border bg-parchment"
        >
          <form onSubmit={handleSubmit} className="h-[44px] flex items-center px-[var(--ds-space-lg)] gap-[var(--ds-space-xs)] max-w-screen-xl mx-auto">
            <Search size={16} className="text-disabled shrink-0" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search sarees, kantha jackets, tote bags..."
              containerClassName="flex-1 max-w-[400px]"
              className="h-auto border-0 bg-transparent px-0 py-0 text-body-xs focus:border-transparent"
            />
            <IconButton
              type="button"
              onClick={onClose}
              variant="ghost"
              size="sm"
              aria-label="Close search"
            >
              <X size={16} />
            </IconButton>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
