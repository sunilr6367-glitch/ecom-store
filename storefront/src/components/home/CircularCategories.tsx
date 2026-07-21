import type { HomepageCategoryCircle } from '@/types/homepage';
import { CircularCategoriesClient } from './CircularCategoriesClient';

export function CircularCategories({ circles }: { circles: HomepageCategoryCircle[] }) {
  if (circles.length === 0) return null;
  return <CircularCategoriesClient circles={circles.slice(0, 10)} />;
}
