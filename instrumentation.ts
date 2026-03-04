export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('===================================================');
    console.log('[STARTUP] Starting application initialization...');
    
    // 1. Test Database Connection
    try {
      // Dynamic import to avoid issues with edge runtime
      const { sql } = await import('./lib/db');
      
      if (!sql) {
        console.warn('[STARTUP] ⚠️ DATABASE_URL is not configured. Skipping database connection test.');
      } else {
        console.log('[STARTUP] Testing database connection...');
        await sql`SELECT 1 as connected`;
        console.log('[STARTUP] ✅ Successfully connected to PostgreSQL database.');
      }
    } catch (error) {
      console.error('[STARTUP] ❌ Failed to connect to PostgreSQL database:', error);
    }

    // 2. Test Telegram API (Web Scraper) Connection
    try {
      console.log('[STARTUP] Testing connection to Telegram Web (t.me)...');
      const response = await fetch('https://t.me/s/telegram', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (response.ok) {
        console.log('[STARTUP] ✅ Successfully connected to Telegram Web.');
      } else {
        console.warn(`[STARTUP] ⚠️ Telegram Web returned status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[STARTUP] ❌ Failed to connect to Telegram Web:', error);
    }
    
    console.log('[STARTUP] Application initialization complete.');
    console.log('===================================================');
  }
}
