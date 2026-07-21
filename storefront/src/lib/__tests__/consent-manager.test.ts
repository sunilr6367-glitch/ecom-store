import { describe, it, expect, beforeEach } from 'vitest';
import { ConsentManager } from '@/lib/consent-manager';

describe('ConsentManager', () => {
    beforeEach(() => {
        ConsentManager.clear();
    });

    it('defaults to no consent', () => {
        expect(ConsentManager.hasConsentFor('analytics')).toBe(false);
    });

    it('stores and reports consent', () => {
        ConsentManager.setConsent({
            essential: true,
            analytics: true,
            marketing: false,
            session_recording: false,
        });
        expect(ConsentManager.hasConsentFor('analytics')).toBe(true);
        expect(ConsentManager.getConsent()).toMatchObject({
            categories: { analytics: true },
        });
    });
});
