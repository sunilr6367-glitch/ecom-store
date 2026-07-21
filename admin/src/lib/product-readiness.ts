export type AdminProductReadinessInput = {
  title?: string;
  handle?: string;
  priceType?: 'fixed' | 'on_request';
  inrPrice?: string;
  mediaCount?: number;
  categoryCount?: number;
  collectionId?: string;
  material?: string;
  seoTitle?: string;
  seoDescription?: string;
  mediaWithAltCount?: number;
};

export type AdminProductReadinessIssue = {
  field: string;
  message: string;
};

const PLACEHOLDER_TITLE_PATTERN =
  /\b(test|testing|dummy|demo|sample|placeholder|lorem|hhj|asdf|abc|untitled)\b/i;

function clean(value?: string | null) {
  return value?.trim() || '';
}

export function getAdminProductReadinessIssues(
  input: AdminProductReadinessInput
) {
  const issues: AdminProductReadinessIssue[] = [];
  const title = clean(input.title);
  const parsedPrice = Number.parseFloat(input.inrPrice || '');

  if (title.length < 3 || PLACEHOLDER_TITLE_PATTERN.test(title)) {
    issues.push({
      field: 'title',
      message: 'Use a real storefront title, not test/demo/placeholder copy.',
    });
  }

  if (!clean(input.handle)) {
    issues.push({
      field: 'handle',
      message: 'Add a clean URL handle.',
    });
  }

  if (!input.mediaCount) {
    issues.push({
      field: 'media',
      message: 'Add at least one product image.',
    });
  } else if (input.mediaWithAltCount !== undefined && input.mediaWithAltCount < input.mediaCount) {
    issues.push({
      field: 'altText',
      message: 'Add Alt Text to all images for better Image SEO.',
    });
  }

  if (input.priceType !== 'fixed' || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    issues.push({
      field: 'price',
      message: 'Published storefront products need a fixed INR price.',
    });
  }

  if (!input.categoryCount && !clean(input.collectionId)) {
    issues.push({
      field: 'category',
      message: 'Assign at least one category or collection.',
    });
  }

  if (!clean(input.material)) {
    issues.push({
      field: 'material',
      message: 'Add material or craft detail for premium product trust.',
    });
  }

  if (!clean(input.seoTitle)) {
    issues.push({
      field: 'seoTitle',
      message: 'Add an SEO page title.',
    });
  }

  if (!clean(input.seoDescription)) {
    issues.push({
      field: 'seoDescription',
      message: 'Add a meta description.',
    });
  }

  return issues;
}

export function getAdminProductReadinessScore(
  input: AdminProductReadinessInput
) {
  const totalChecks = 8;
  const issueCount = getAdminProductReadinessIssues(input).length;
  return Math.round(((totalChecks - issueCount) / totalChecks) * 100);
}
