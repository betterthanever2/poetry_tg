import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  console.log('[DB] Initializing PostgreSQL connection pool...');
} else {
  console.warn('[DB] ⚠️ DATABASE_URL is not set. Database connection will not be available.');
}

let sqlInstance: postgres.Sql<{}> | null = null;

try {
  if (connectionString) {
    // postgres.js passes unknown URL parameters to the server as config parameters.
    // "schema" is not a valid Postgres config parameter (search_path is), so we remove it.
    const url = new URL(connectionString);
    url.searchParams.delete('schema');
    
    sqlInstance = postgres(url.toString(), {
      transform: postgres.camel,
    });
  }
} catch (error) {
  console.error('[DB] ❌ Failed to initialize PostgreSQL client:', error);
}

// Export a singleton connection
export const sql = sqlInstance;

let isInitialized = false;

export async function ensureDbInitialized() {
  if (!sql || isInitialized) return;
  
  try {
    // Check if channels table exists
    const [{ exists }] = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'channels'
      );
    `;
    
    if (!exists) {
      console.log('[DB] Tables do not exist. Running initial migration...');
      const schemaPath = path.join(process.cwd(), 'migrations', '001_initial_schema.sql');
      await sql.file(schemaPath);
      console.log('[DB] ✅ Database schema initialized successfully.');
    }
    isInitialized = true;
  } catch (error) {
    console.error('[DB] ❌ Failed to initialize database schema:', error);
    isInitialized = true; // Prevent infinite retries on failure
  }
}
