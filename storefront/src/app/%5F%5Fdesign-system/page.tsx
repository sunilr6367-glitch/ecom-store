import { notFound } from 'next/navigation';
import { ComponentLab } from './ComponentLab';

export const dynamic = 'force-dynamic';

export default function DesignSystemLabPage() {
  if (process.env.DESIGN_SYSTEM_LAB !== 'true' && process.env.NEXT_PUBLIC_DESIGN_SYSTEM_LAB !== 'true') notFound();
  return <ComponentLab />;
}
