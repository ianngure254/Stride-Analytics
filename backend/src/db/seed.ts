import 'dotenv/config';
import { db } from './client';
import { seed } from 'drizzle-seed';
import * as schema from './schema';

async function main() {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!databaseUrl) {
        console.error('Error: DATABASE_URL is not set in .env file');
        console.error('Please add: DATABASE_URL=postgresql://user:password@host:port/database');
        process.exit(1);
    }

    if (databaseUrl.includes('username') || databaseUrl.includes('password')) {
        console.error('Error: DATABASE_URL contains placeholder credentials');
        console.error('Please replace "username" and "password" with actual values');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        console.log('Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

        console.log('Resetting and seeding database...');
        console.log('Generating: 20 customers, 50 products, 100 sales with payments');

        await seed(db, schema as any).refine(() => ({
            customers: { count: 20 },
            products: { count: 50 },
            sales: {
                count: 100,
                columns: {
                    status: { type: 'enum', values: ['pending', 'completed', 'cancelled'] },
                },
            },
            payments: { count: 100 },
            credits: { count: 20 },
        }));

        console.log('Seeding completed successfully!');
        console.log('- 20 customers created');
        console.log('- 50 products created');
        console.log('- 100 sales with payments created');
        console.log('- 20 credits created');
    } catch (err) {
        console.error('Seeding failed:', err instanceof Error ? err.message : err);
        if (err instanceof Error && err.message.includes('connection')) {
            console.error('Please check your DATABASE_URL and ensure the database is accessible');
        }
        process.exit(1);
    }
}

main();
