import 'dotenv/config';
import { db } from './db/client';
import { products } from './db/schema';

async function main() {
    const allProducts = await db.select().from(products);
    console.log(allProducts);
}
main();

