import { db } from '../db/client';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const SettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  category: z
    .enum([
      'general',
      'homepage',
      'notifications',
      'security',
      'email',
      'payment',
      'shipping',
    ])
    .optional(),
});

export type SettingInput = z.infer<typeof SettingSchema>;

class SettingService {
  async getAll() {
    const allSettings = await db.select().from(settings);
    // Group by category
    return allSettings.reduce((acc: any, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = {};
      }
      acc[category][setting.key] = setting.value;
      return acc;
    }, {});
  }

  async getByCategory(category: string) {
    const categorySettings = await db
      .select()
      .from(settings)
      .where(eq(settings.category, category));

    return categorySettings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  async getByKey(key: string) {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting || null;
  }

  async upsert(key: string, data: SettingInput) {
    const existing = await this.getByKey(key);
    let result;

    if (existing) {
      [result] = await db
        .update(settings)
        .set({
          value: data.value,
          category: data.category || existing.category,
          updated_at: new Date(),
        })
        .where(eq(settings.key, key))
        .returning();
    } else {
      [result] = await db
        .insert(settings)
        .values({
          key: data.key,
          value: data.value,
          category: data.category || 'general',
        })
        .returning();
    }
    return result;
  }

  async bulkUpsert(settingsMap: Record<string, any>) {
    const results = [];
    for (const [key, value] of Object.entries(settingsMap)) {
      // Re-use logic or optimize for bulk if supported by DB (upsert)
      // Postgres supports ON CONFLICT but Drizzle syntax varies slightly.
      // For now, loop safe approach as volume is low.
      const result = await this.upsert(key, { key, value } as any);
      results.push(result);
    }
    return results;
  }

  async delete(key: string) {
    const [deleted] = await db
      .delete(settings)
      .where(eq(settings.key, key))
      .returning();
    return deleted || null;
  }
}

export const settingService = new SettingService();
