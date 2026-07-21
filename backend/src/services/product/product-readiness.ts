import type { CreateProductInput, UpdateProductInput } from './product-validator';

export type PublishReadinessIssue = {
  field: string;
  message: string;
};

const PLACEHOLDER_TITLE_PATTERN =
  /\b(test|testing|dummy|demo|sample|placeholder|lorem|hhj|asdf|abc|untitled)\b/i;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasUsableTitle(title: unknown) {
  const value = text(title);
  return value.length > 2 && !PLACEHOLDER_TITLE_PATTERN.test(value);
}

function hasMedia(data: CreateProductInput | UpdateProductInput) {
  return Boolean(text(data.thumbnail) || data.images?.some((image) => text(image.url)));
}

function hasSellableFixedPrice(data: CreateProductInput | UpdateProductInput) {
  if ((data.price_type || 'fixed') !== 'fixed') return false;
  return Boolean(data.prices?.some((price) => Number(price.amount) > 0));
}

export function getNewProductPublishReadinessIssues(
  data: CreateProductInput | UpdateProductInput
) {
  const issues: PublishReadinessIssue[] = [];

  if (!hasUsableTitle(data.title)) {
    issues.push({
      field: 'title',
      message: 'Published products need a real customer-facing title, not a test or placeholder name.',
    });
  }

  if (!text(data.handle)) {
    issues.push({
      field: 'handle',
      message: 'Published products need a URL handle.',
    });
  }

  if (!hasMedia(data)) {
    issues.push({
      field: 'images',
      message: 'Published products need at least one product image or cover thumbnail.',
    });
  }

  if (!hasSellableFixedPrice(data)) {
    issues.push({
      field: 'prices',
      message: 'Published products need fixed pricing with at least one positive price.',
    });
  }

  if (!data.category_ids?.length && !data.collection_id) {
    issues.push({
      field: 'category_ids',
      message: 'Published products need at least one category or collection.',
    });
  }

  return issues;
}
