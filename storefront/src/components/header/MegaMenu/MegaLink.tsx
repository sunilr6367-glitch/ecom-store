import Link from 'next/link';
import styles from '../header.module.css';

interface MegaLinkProps {
  label: string;
  href: string;
  isNew?: boolean;
  onClick?: () => void;
}

export function MegaLink({ label, href, isNew, onClick }: MegaLinkProps) {
  return (
    <Link href={href} className={styles.mmLink} onClick={onClick}>
      {label}
      {isNew && (
        <span className="kv-count-badge text-inverse bg-accent px-1.5 py-px rounded-sm leading-token-tight">
          New
        </span>
      )}
    </Link>
  );
}
