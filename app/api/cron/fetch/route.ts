import { NextResponse } from 'next/server';
import { sql, ensureDbInitialized } from '@/lib/db';
import { scrapeTelegramChannel } from '@/lib/telegram';
import { generateEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 503 });
  }

  // Basic security: require a secret token to trigger the cron job
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDbInitialized();
    // Fetch all active channels
    const channels = await sql`SELECT id, url FROM channels WHERE is_active = true`;
    let newPostsCount = 0;

    for (const channel of channels) {
      try {
        const { posts } = await scrapeTelegramChannel(channel.url);
        
        for (const post of posts) {
          // Check if post already exists
          const [existing] = await sql`
            SELECT id FROM posts WHERE channel_id = ${channel.id} AND telegram_message_id = ${post.telegramMessageId}
          `;
          if (existing) continue;

          // Generate embedding
          const embedding = await generateEmbedding(post.content);

          // Insert post
          await sql`
            INSERT INTO posts (channel_id, telegram_message_id, content, media_url, views, published_at, embedding)
            VALUES (
              ${channel.id}, 
              ${post.telegramMessageId}, 
              ${post.content}, 
              ${post.mediaUrl || null}, 
              ${post.views}, 
              ${post.publishedAt},
              ${JSON.stringify(embedding)}
            )
          `;
          newPostsCount++;
        }
        
        // Update last fetched timestamp
        await sql`UPDATE channels SET last_fetched_at = CURRENT_TIMESTAMP WHERE id = ${channel.id}`;
        
      } catch (err) {
        console.error(`Failed to fetch channel ${channel.url}:`, err);
      }
    }

    return NextResponse.json({ success: true, newPostsCount });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
