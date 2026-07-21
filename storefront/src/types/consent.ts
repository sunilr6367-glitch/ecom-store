// This file defines the types that drive our consent management system.
// Categories mirror Third-Party scripts that require explicit opt-in.

export type ConsentType =
    | 'analytics'          // Google Analytics, Facebook Pixel, etc.
    | 'marketing'          // Chat widgets, marketing tags (Tawk.to, ads)
    | 'session_recording'  // LogRocket, Hotjar, etc.
    | 'essential';         // Core functionality, always allowed

export interface UserConsent {
    timestamp: number;    // when the choices were made
    version: string;      // to allow invalidation/upgrade of schema
    categories: {
        essential: boolean;       // always true (set by manager)
        analytics: boolean;       // tracking & metrics
        marketing: boolean;       // chat widgets, ad networks
        session_recording: boolean; // LogRocket / Hotjar
    };
}
