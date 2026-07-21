import { MegaLink } from './MegaLink';

interface MegaColumnItem {
  label: string;
  href: string;
  isNew?: boolean;
}

interface MegaColumnGroup {
  label: string;
  items: MegaColumnItem[];
}

interface MegaColumnProps {
  groups: MegaColumnGroup[];
  viewAllLabel?: string;
  viewAllHref?: string;
  onClose: () => void;
}

export function MegaColumn({ groups, viewAllLabel, viewAllHref, onClose }: MegaColumnProps) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p
            className="font-label text-body-xs font-medium tracking-token-wide text-disabled mb-4 pb-2.5 border-b border-surface-parchment-2"
          >
            {group.label}
          </p>
          <div className="flex flex-col">
            {group.items.map((item) => (
              <MegaLink key={item.href} {...item} onClick={onClose} />
            ))}
          </div>
        </div>
      ))}
      {viewAllLabel && viewAllHref && (
        <MegaLink
          label={viewAllLabel}
          href={viewAllHref}
          onClick={onClose}
        />
      )}
    </div>
  );
}
