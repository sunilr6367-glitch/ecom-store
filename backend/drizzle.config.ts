/// <reference types="node" />
import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/store_dev',
    },
    verbose: true,
    strict: true,
} satisfies Config;
