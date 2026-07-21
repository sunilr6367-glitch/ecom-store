import { db } from '../db/client';
import { regions, countries } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// --- Validation Schemas ---
export const RegionSchema = z.object({
  name: z.string().min(1),
  currency_code: z
    .string()
    .length(3)
    .transform((val) => val.toLowerCase()),
  tax_rate: z.number().min(0).max(100).optional(),
  tax_code: z.string().optional(),
  countries: z.array(z.string().length(2)).optional(), // List of ISO-2 codes
});

export type CreateRegionInput = z.infer<typeof RegionSchema>;
export type UpdateRegionInput = Partial<CreateRegionInput>;

// --- Service Logic ---
class RegionService {
  async list() {
    // TODO: In a real app, I would also fetch associated countries
    return await db.select().from(regions);
  }

  async getById(id: string) {
    const result = await db.select().from(regions).where(eq(regions.id, id));
    return result[0] || null;
  }

  async create(data: CreateRegionInput) {
    return await db.transaction(async (tx) => {
      // 1. Create Region
      const [region] = await tx
        .insert(regions)
        .values({
          name: data.name,
          currency_code: data.currency_code,
          tax_rate: data.tax_rate ? String(data.tax_rate) : '0',
          tax_code: data.tax_code,
        })
        .returning();

      // 2. Add Countries if provided
      if (data.countries && data.countries.length > 0) {
        // Note: In a full implementation, we'd upsert countries or link existing ones.
        // For now, let's assume we are creating basic country entries linked to this region.
        for (const iso of data.countries) {
          await tx.insert(countries).values({
            iso_2: iso.toLowerCase(),
            name: iso.toUpperCase(), // Placeholder
            display_name: iso.toUpperCase(),
            region_id: region.id,
          });
        }
      }

      return region;
    });
  }

  async update(id: string, data: UpdateRegionInput) {
    return await db.transaction(async (tx) => {
      // 1. Update Region
      const updateData: any = { updated_at: new Date() };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.currency_code !== undefined)
        updateData.currency_code = data.currency_code;
      if (data.tax_rate !== undefined)
        updateData.tax_rate = String(data.tax_rate);
      if (data.tax_code !== undefined) updateData.tax_code = data.tax_code;

      const [updatedRegion] = await tx
        .update(regions)
        .set(updateData)
        .where(eq(regions.id, id))
        .returning();

      if (!updatedRegion) return null;

      // 2. Update Countries if provided
      if (data.countries && data.countries.length > 0) {
        // First delete existing countries for this region
        // WARN: This is a destructive operation for countries, assuming they strictly belong to regions here
        await tx.delete(countries).where(eq(countries.region_id, id));

        // Then add new countries
        for (const iso of data.countries) {
          await tx.insert(countries).values({
            iso_2: iso.toLowerCase(),
            name: iso.toUpperCase(), // Placeholder
            display_name: iso.toUpperCase(),
            region_id: id,
          });
        }
      }

      return updatedRegion;
    });
  }

  async delete(id: string) {
    // BUG-020 FIX: Delete associated countries before region
    const result = await db.transaction(async (tx) => {
      // First check if region exists
      const existing = await tx
        .select({ id: regions.id })
        .from(regions)
        .where(eq(regions.id, id))
        .limit(1);

      if (existing.length === 0) {
        return null;
      }

      await tx.delete(countries).where(eq(countries.region_id, id));
      await tx.delete(regions).where(eq(regions.id, id));
      return true;
    });
    return result;
  }
}

export const regionService = new RegionService();
