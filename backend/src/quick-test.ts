import 'dotenv/config';
import { db } from './db/client';
import { products } from './db/schema';


async function test () {
    const allProducts = await db.select().from(products);

    console.log("✅WORKS!", allProducts);
}

test().catch(console.error);

