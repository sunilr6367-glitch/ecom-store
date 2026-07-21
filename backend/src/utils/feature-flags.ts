/**
 * Feature Flags - Phase 4 Q22: Feature Flags
 *
 * Provides runtime feature flag management with targeting rules.
 */

import { z } from 'zod';

/**
 * Feature flag configuration interface
 */
export interface FeatureFlag {
  /** Unique flag name */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Whether the flag is enabled by default */
  enabled?: boolean;
  /** Percentage of users to enable (0-100) */
  rolloutPercent?: number;
  /** Specific user IDs to enable for */
  userIds?: string[];
  /** Specific email domains to enable for */
  emailDomains?: string[];
  /** Environment filter (only enable in these envs) */
  environments?: string[];
  /** Start date for the flag */
  startDate?: Date;
  /** End date for the flag */
  endDate?: Date;
  /** Targeting rules (custom key-value pairs) */
  targeting?: Record<string, unknown>;
}

export type FeatureFlags = Record<string, FeatureFlag>;

/**
 * User context for targeting
 */
export interface TargetingContext {
  userId?: string;
  email?: string;
  region?: string;
  isAdmin?: boolean;
  isWholesale?: boolean;
  [key: string]: unknown;
}

/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
  private flags: FeatureFlags = {};
  private context: TargetingContext = {};
  private cache: Map<string, boolean> = new Map();
  private env: string;

  constructor(env?: string) {
    this.env = env || process.env.NODE_ENV || 'development';
    this.loadDefaultFlags();
  }

  /**
   * Load default feature flags
   */
  private loadDefaultFlags(): void {
    this.flags = {
      new_checkout: {
        name: 'new_checkout',
        description: 'Enable new checkout flow',
        enabled: true,
        rolloutPercent: 50,
        environments: ['development', 'staging', 'production'],
      },
      wholesale_pricing: {
        name: 'wholesale_pricing',
        description: 'Enable wholesale pricing display',
        enabled: true,
        userIds: [],
        environments: ['development', 'staging', 'production'],
      },
      email_verification: {
        name: 'email_verification',
        description: 'Require email verification for registration',
        enabled: true,
        environments: ['development', 'staging', 'production'],
      },
      two_factor_auth: {
        name: 'two_factor_auth',
        description: 'Enable 2FA option for accounts',
        enabled: true,
        rolloutPercent: 100,
        environments: ['development', 'staging', 'production'],
      },
      guest_checkout: {
        name: 'guest_checkout',
        description: 'Allow checkout without account',
        enabled: true,
        environments: ['development', 'staging', 'production'],
      },
      newsletter_signup: {
        name: 'newsletter_signup',
        description: 'Newsletter signup option',
        enabled: true,
        environments: ['development', 'staging', 'production'],
      },
      wishlist: {
        name: 'wishlist',
        description: 'Product wishlist feature',
        enabled: false,
        environments: ['development', 'staging'],
      },
      advanced_search: {
        name: 'advanced_search',
        description: 'Advanced product search with filters',
        enabled: true,
        rolloutPercent: 100,
        environments: ['development', 'staging', 'production'],
      },
    };
  }

  /**
   * Set targeting context
   */
  setContext(context: TargetingContext): void {
    this.context = context;
    this.clearCache();
  }

  /**
   * Clear the evaluation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all flags
   */
  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Get a specific flag
   */
  get(name: string): FeatureFlag | undefined {
    return this.flags[name];
  }

  /**
   * Register a new flag
   */
  register(flag: FeatureFlag): void {
    this.flags[flag.name] = flag;
  }

  /**
   * Update a flag
   */
  update(name: string, updates: Partial<FeatureFlag>): void {
    if (this.flags[name]) {
      this.flags[name] = { ...this.flags[name], ...updates };
      this.cache.delete(name);
    }
  }

  /**
   * Enable a flag
   */
  enable(name: string): void {
    this.update(name, { enabled: true });
  }

  /**
   * Disable a flag
   */
  disable(name: string): void {
    this.update(name, { enabled: false });
  }

  /**
   * Set rollout percentage
   */
  setRollout(name: string, percent: number): void {
    this.update(name, { rolloutPercent: Math.min(100, Math.max(0, percent)) });
  }

  /**
   * Check if a flag is enabled
   */
  async isEnabled(name: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    const flag = this.flags[name];
    if (!flag) {
      this.cache.set(name, false);
      return false;
    }

    const result = this.evaluate(flag);
    this.cache.set(name, result);
    return result;
  }

  /**
   * Evaluate a flag against context
   */
  private evaluate(flag: FeatureFlag): boolean {
    const env = flag.environments || ['development'];
    // Check environment
    if (!env.includes(this.env)) {
      return false;
    }

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) {
      return false;
    }
    if (flag.endDate && now > flag.endDate) {
      return false;
    }

    // Check if disabled with no targeting
    if (!flag.enabled && !flag.rolloutPercent && !flag.userIds?.length) {
      return false;
    }

    // Check user IDs
    if (flag.userIds?.length && this.context.userId) {
      if (flag.userIds.includes(this.context.userId)) {
        return true;
      }
    }

    // Check email domains
    if (flag.emailDomains?.length && this.context.email) {
      const domain = this.context.email.split('@')[1];
      if (flag.emailDomains.includes(domain)) {
        return true;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercent && flag.rolloutPercent > 0) {
      if (this.context.userId) {
        // Consistent rollout based on user ID hash
        const hash = this.hashUserId(this.context.userId);
        const percentile = hash % 100;
        if (percentile < flag.rolloutPercent) {
          return true;
        }
      }
    }

    // Check if fully enabled
    if (flag.enabled && flag.rolloutPercent === 100) {
      return true;
    }

    return false;
  }

  /**
   * Hash user ID for consistent rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Export flags configuration
   */
  export(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Import flags configuration
   */
  import(flags: FeatureFlags): void {
    this.flags = { ...flags };
    this.clearCache();
  }
}

/**
 * Singleton instance
 */
let flagManager: FeatureFlagManager | null = null;

/**
 * Get feature flag manager instance
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!flagManager) {
    flagManager = new FeatureFlagManager();
  }
  return flagManager;
}

/**
 * Convenience function to check if a flag is enabled
 */
export async function isEnabled(
  name: string,
  context?: TargetingContext
): Promise<boolean> {
  const manager = getFeatureFlagManager();
  if (context) {
    manager.setContext(context);
  }
  return manager.isEnabled(name);
}

/**
 * Enable a feature flag
 */
export function enable(name: string): void {
  getFeatureFlagManager().enable(name);
}

/**
 * Disable a feature flag
 */
export function disable(name: string): void {
  getFeatureFlagManager().disable(name);
}

export default FeatureFlagManager;
