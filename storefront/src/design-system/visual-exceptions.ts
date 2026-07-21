export interface VisualException {
  id: string;
  target: string;
  property: string;
  allowedValue: string;
  reason: string;
  owner: string;
  reviewDate: `${number}-${number}-${number}`;
  testReference: string;
}

export const visualExceptions = [
  {
    id: 'immersive-reels-surface', target: '/reels', property: 'width', allowedValue: 'flush',
    reason: 'Vertical video requires an immersive media viewport while retaining certified controls.', owner: 'storefront', reviewDate: '2026-12-31', testReference: 'e2e/architecture/reels.spec.ts',
  },
] as const satisfies readonly VisualException[];
