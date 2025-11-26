import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    host: 'db.ipwmjitjokdtzzchfajr.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'lyIAd8zO8e61LQcW',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database successfully.');

        const sqlPath = path.join(__dirname, 'supabase_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running schema migration...');
        await client.query(sql);
        console.log('Schema migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
