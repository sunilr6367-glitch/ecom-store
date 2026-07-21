import { db } from './src/db/client';
import { regions } from './src/db/schema';

async function test() {
  const result = await db.select({ name: regions.name, id: regions.id }).from(regions);
  console.log('--- DB REGIONS ---');
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
test();
