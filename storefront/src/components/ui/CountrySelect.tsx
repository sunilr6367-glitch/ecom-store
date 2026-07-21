'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { countries, commonCountries, getCountryName } from '@/config/countries';
import Input from '@/components/ui/Input';
import { PopoverPanel } from '@/components/ui/Popover';
import { UnstyledButton } from '@/components/ui/Button';

interface CountrySelectProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function CountrySelect({
  name,
  value,
  onChange,
  required = false,
  className = '',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter countries based on search
  const filteredCountries = search
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  // Separate common and other countries
  const common = filteredCountries.filter((c) =>
    commonCountries.includes(c.code)
  );
  const others = filteredCountries.filter(
    (c) => !commonCountries.includes(c.code)
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  const displayValue = value ? getCountryName(value) : '';

  return (
    <div ref={inputRef} className={`relative ${className}`}>
      <UnstyledButton
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-control-typography flex h-12 w-full items-center justify-between border border-border-subtle bg-surface-paper px-3 text-left text-primary outline-none transition-colors focus:border-accent sm:h-11"
        aria-label={required ? `${name}, required` : name}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={displayValue ? 'text-primary' : 'text-muted'}>
          {displayValue || `Select ${name}`}
        </span>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </UnstyledButton>

      {isOpen && (
        <PopoverPanel align="left" className="max-h-80 w-full">
          {/* Search Input */}
          <div className="border-b border-border-subtle p-2">
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 text-body-sm"
              aria-label="Search country"
            />
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto max-h-60">
            {/* Common Countries */}
            {common.length > 0 && (
              <>
                <div className="bg-surface-soft px-3 py-1.5 text-body-xs font-bold  tracking-token-wider text-muted">
                  Popular
                </div>
                {common.map((country) => (
                  <UnstyledButton
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full px-4 py-2.5 text-left text-body-sm flex items-center justify-between hover:bg-surface-soft ${
                      value === country.code
                        ? 'bg-surface-soft text-primary font-medium'
                        : 'text-secondary'
                    }`}
                  >
                    <span>{country.name}</span>
                    {value === country.code && (
                      <Check size={16} className="text-primary" />
                    )}
                  </UnstyledButton>
                ))}
              </>
            )}

            {/* All Countries */}
            {others.length > 0 && (
              <>
                <div className="bg-surface-soft px-3 py-1.5 text-body-xs font-bold  tracking-token-wider text-muted">
                  {common.length > 0 ? 'All Countries' : 'Countries'}
                </div>
                {others.map((country) => (
                  <UnstyledButton
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full px-4 py-2.5 text-left text-body-sm flex items-center justify-between hover:bg-surface-soft ${
                      value === country.code
                        ? 'bg-surface-soft text-primary font-medium'
                        : 'text-secondary'
                    }`}
                  >
                    <span>{country.name}</span>
                    {value === country.code && (
                      <Check size={16} className="text-primary" />
                    )}
                  </UnstyledButton>
                ))}
              </>
            )}

            {filteredCountries.length === 0 && (
              <div className="px-4 py-6 text-center text-body-sm text-muted">
                No countries found
              </div>
            )}
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}

