import 'dotenv/config';
import { db } from './client';
import { products, customers } from './schema';
import type { InferInsertModel } from 'drizzle-orm';

/**
 * System Data Seeder
 * Seeds essential business data that should always exist in the database
 * This includes default products, sample customers, etc.
 */

const SYSTEM_PRODUCTS: InferInsertModel<typeof products>[] = [
    {
        name: 'Sample Product A',
        description: 'A sample product for testing purposes',
        price: '29.99',
        stock: "100",
        category: 'Electronics',
        isActive: true,
    },
    {
        name: 'Sample Product B',
        description: 'Another sample product',
        price: '49.99',
        stock: "50",
        category: 'Electronics',
        isActive: true,
    },
    {
        name: 'Office Chair',
        description: 'Ergonomic office chair',
        price: '199.99',
        stock: "25",
        category: 'Furniture',
        isActive: true,
    },
    {
        name: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness',
        price: '35.00',
        stock: "75.00",
        category: 'Furniture',
        isActive: true,
    },
    {
        name: 'Notebook',
        description: 'A4 size notebook, 200 pages',
        price: '5.99',
        stock: "200.00",
        category: 'Stationery',
        isActive: true,
    },
];

const SYSTEM_CUSTOMERS = [
    {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, Country',
    },
    {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
        address: '456 Oak Ave, Town, Country',
    },
];

async function seedSystemData() {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!databaseUrl) {
        console.error('Error: DATABASE_URL is not set in .env file');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        console.log('Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

        // Check if products already exist
        const existingProducts = await db.select().from(products).limit(1);

        if (existingProducts.length > 0) {
            console.log('Products already exist in database. Skipping system data seeding.');
            console.log('If you want to reset and re-seed, run: npm run db:seed');
            return;
        }

        console.log('Seeding system data...');

        // Seed products
        console.log('Creating system products...');
        for (const product of SYSTEM_PRODUCTS) {
            await db.insert(products).values(product);
        }
        console.log(`Created ${SYSTEM_PRODUCTS.length} system products`);

        // Seed customers
        console.log('Creating system customers...');
        for (const customer of SYSTEM_CUSTOMERS) {
            await db.insert(customers).values(customer);
        }
        console.log(`Created ${SYSTEM_CUSTOMERS.length} system customers`);

        console.log('System data seeding completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run the server: npm run dev');
        console.log('2. Test the API at: http://localhost:3000/api/health');
        console.log('3. Get products: GET http://localhost:3000/api/products');
    } catch (err) {
        console.error('System data seeding failed:', err instanceof Error ? err.message : err);
        if (err instanceof Error && err.message.includes('connection')) {
            console.error('Please check your DATABASE_URL and ensure the database is accessible');
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedSystemData();
}

export { seedSystemData, SYSTEM_PRODUCTS, SYSTEM_CUSTOMERS };
