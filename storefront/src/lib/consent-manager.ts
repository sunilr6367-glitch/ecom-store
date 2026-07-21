import { ConsentType, UserConsent } from '@/types/consent';

// Lightweight client-side helper for storing and querying user consent
// using localStorage.  The implementation is intentionally simple; we
// don't need a dependency on an external CMP library for this project.

class ConsentManager {
    private static readonly CONSENT_KEY = 'user_consent';
    private static readonly CONSENT_VERSION = '1.0';

    /**
     * Reads the current consent object from localStorage, validating its
     * structure and expiry (30 days). Returns null if nothing is stored or
     * the data is malformed/expired.
     */
    static getConsent(): UserConsent | null {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(this.CONSENT_KEY);
        if (!stored) return null;

        try {
            const consent = JSON.parse(stored) as UserConsent;

            // simple version check - could be used to reset UI when schema changes
            if (consent.version !== this.CONSENT_VERSION) {
                return null;
            }

            // expire after 30 days
            if (Date.now() - consent.timestamp > 30 * 24 * 60 * 60 * 1000) {
                return null;
            }

            return consent;
        } catch {
            return null;
        }
    }

    /**
     * Persists a new consent object with supplied category flags.
     */
    static setConsent(categories: UserConsent['categories']): void {
        if (typeof window === 'undefined') return;
        const consent: UserConsent = {
            timestamp: Date.now(),
            version: this.CONSENT_VERSION,
            categories,
        };
        try {
            localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consent));
        } catch {
            // ignore (storage full/disabled)
        }
    }

    /**
     * Helper for components to ask whether a given category has been
     * approved by the user. `essential` always returns true.
     */
    static hasConsentFor(category: ConsentType): boolean {
        if (category === 'essential') return true;
        const consent = this.getConsent();
        return consent?.categories[category] ?? false;
    }

    /**
     * Convenience shortcuts used by the banner buttons.
     */
    static acceptAll(): void {
        this.setConsent({
            essential: true,
            analytics: true,
            marketing: true,
            session_recording: true,
        });
    }

    static rejectAll(): void {
        this.setConsent({
            essential: true,
            analytics: false,
            marketing: false,
            session_recording: false,
        });
    }

    /**
     * Clears stored consent (used by tests and when resetting preferences).
     */
    static clear(): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(this.CONSENT_KEY);
        } catch {
            // ignore
        }
    }
}

export { ConsentManager };
