/**
 * Seed default tags for Odhvica platform
 * Run this once to populate default tags that products can be tagged with
 * Safe to run multiple times - checks for existing tags before creating
 */

import { db } from '../src/db/client';
import { tags } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_TAGS = [
    { name: 'new-arrival', label: 'New Arrival' },
    { name: 'bestseller', label: 'Bestseller' },
    { name: 'sale', label: 'Sale' },
    { name: 'handmade', label: 'Handmade' },
    { name: 'kantha', label: 'Kantha' },
    { name: 'limited-edition', label: 'Limited Edition' },
    { name: 'plus-size', label: 'Plus Size' },
    { name: 'gifting', label: 'Gifting' },
    { name: 'sustainable', label: 'Sustainable' },
];

async function seedTags() {
    console.log('🌱 Starting tag seeding...');

    try {
        let createdCount = 0;
        let skippedCount = 0;

        for (const tag of DEFAULT_TAGS) {
            // Check if tag already exists
            const existing = await db
                .select()
                .from(tags)
                .where(eq(tags.slug, tag.name))
                .limit(1);

            if (existing.length > 0) {
                console.log(`✓ Tag "${tag.label}" already exists - skipping`);
                skippedCount++;
            } else {
                // Create new tag
                await db.insert(tags).values({
                    name: tag.label,
                    slug: tag.name,
                    description: null,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
                console.log(`✓ Created tag "${tag.label}"`);
                createdCount++;
            }
        }

        console.log(`\n✅ Tag seeding complete!`);
        console.log(`   Created: ${createdCount}`);
        console.log(`   Skipped: ${skippedCount}`);
        console.log(`   Total: ${DEFAULT_TAGS.length}`);
    } catch (error) {
        console.error('❌ Error seeding tags:', error);
        process.exit(1);
    }
}

// Run the seed
seedTags()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
