/**
 * Service Factory - Phase 4 Q18: Factory Pattern
 *
 * Provides centralized service creation with dependency injection support.
 * Enables easier testing, mocking, and service lifecycle management.
 *
 * Usage:
 *   import { serviceFactory } from './services/factory';
 *   const authService = serviceFactory.authService;
 */

import { db, testConnection, healthCheck } from '../db/client.js';

// Re-export database utilities
export { db, testConnection, healthCheck };

/**
 * Type for any service module
 */
type ServiceModule = Record<string, unknown>;

/**
 * Service factory configuration
 */
export interface ServiceFactoryConfig {
  /** Enable service caching (default: true) */
  enableCaching?: boolean;
}

/**
 * Lazy service container
 */
class ServiceContainer {
  private config: ServiceFactoryConfig;
  private services: Map<string, ServiceModule> = new Map();

  constructor(config: ServiceFactoryConfig = {}) {
    this.config = {
      enableCaching: true,
      ...config,
    };
  }

  /**
   * Auth Service
   */
  get authService(): ServiceModule {
    return this.getOrCreate('authService', () => require('./auth-service.js'));
  }

  /**
   * Customer Auth Service
   */
  get customerAuthService(): ServiceModule {
    return this.getOrCreate('customerAuthService', () =>
      require('./customer-auth-service.js')
    );
  }

  /**
   * Customer Service
   */
  get customerService(): ServiceModule {
    return this.getOrCreate('customerService', () =>
      require('./customer-service.js')
    );
  }

  /**
   * Product Service
   */
  get productService(): ServiceModule {
    return this.getOrCreate('productService', () =>
      require('./product-service.js')
    );
  }

  /**
   * Order Service
   */
  get orderService(): ServiceModule {
    return this.getOrCreate('orderService', () =>
      require('./order-service.js')
    );
  }

  /**
   * Email Service
   */
  get emailService(): ServiceModule {
    return this.getOrCreate('emailService', () =>
      require('./email-service.js')
    );
  }

  /**
   * Region Service
   */
  get regionService(): ServiceModule {
    return this.getOrCreate('regionService', () =>
      require('./region-service.js')
    );
  }

  /**
   * Review Service
   */
  get reviewService(): ServiceModule {
    return this.getOrCreate('reviewService', () =>
      require('./review-service.js')
    );
  }

  /**
   * Analytics Service
   */
  get analyticsService(): ServiceModule {
    return this.getOrCreate('analyticsService', () =>
      require('./analytics-service.js')
    );
  }

  /**
   * Marketing Service
   */
  get marketingService(): ServiceModule {
    return this.getOrCreate('marketingService', () =>
      require('./marketing-service.js')
    );
  }

  /**
   * Settings Service
   */
  get settingsService(): ServiceModule {
    return this.getOrCreate('settingsService', () =>
      require('./setting-service.js')
    );
  }

  /**
   * PDF Service
   */
  get pdfService(): ServiceModule {
    return this.getOrCreate('pdfService', () => require('./pdf-service.js'));
  }

  /**
   * Generic get or create
   */
  private getOrCreate(
    key: string,
    factory: () => ServiceModule
  ): ServiceModule {
    if (this.config.enableCaching && this.services.has(key)) {
      return this.services.get(key)!;
    }
    const instance = factory();
    if (this.config.enableCaching) {
      this.services.set(key, instance);
    }
    return instance;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.services.clear();
  }

  /**
   * Register custom service instance
   */
  register(key: string, instance: ServiceModule): void {
    this.services.set(key, instance);
  }

  /**
   * Create a new container with same config
   */
  clone(): ServiceContainer {
    return new ServiceContainer(this.config);
  }
}

// Singleton instance
let factoryInstance: ServiceContainer | null = null;

/**
 * Get or create service factory instance
 */
export function createServiceFactory(
  config?: ServiceFactoryConfig
): ServiceContainer {
  if (!factoryInstance || config) {
    factoryInstance = new ServiceContainer(config);
  }
  return factoryInstance;
}

/**
 * Default factory instance for easy imports
 */
export const serviceFactory = createServiceFactory();

/**
 * Reset factory (for testing)
 */
export function resetServiceFactory(): void {
  factoryInstance = null;
}

export default ServiceContainer;
