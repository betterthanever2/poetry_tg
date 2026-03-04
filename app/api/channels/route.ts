import { NextResponse } from 'next/server';
import { sql, ensureDbInitialized } from '@/lib/db';
import { scrapeTelegramChannel } from '@/lib/telegram';
import { generateEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!sql) {
    return NextResponse.json([]);
  }

  try {
    await ensureDbInitialized();
    const channels = await sql`
      SELECT id, name, url, avatar_url as "avatarUrl", description, subscribers 
      FROM channels 
      ORDER BY created_at DESC
    `;
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 503 });
  }

  try {
    await ensureDbInitialized();
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Scrape the channel
    const { channel, posts } = await scrapeTelegramChannel(url);

    // Insert channel
    const [insertedChannel] = await sql`
      INSERT INTO channels (name, url, avatar_url, description, subscribers)
      VALUES (${channel.name}, ${url}, ${channel.avatarUrl}, ${channel.description}, ${channel.subscribers})
      ON CONFLICT (url) DO UPDATE SET
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        description = EXCLUDED.description,
        subscribers = EXCLUDED.subscribers
      RETURNING id, name, url, avatar_url as "avatarUrl", description, subscribers
    `;

    // Process posts in background to not block the response
    // In a real production app, this should be sent to a queue (e.g., Cloud Tasks)
    processPosts(insertedChannel.id, posts).catch(console.error);

    return NextResponse.json(insertedChannel);
  } catch (error) {
    console.error('Error adding channel:', error);
    return NextResponse.json({ error: 'Failed to add channel' }, { status: 500 });
  }
}

async function processPosts(channelId: string, posts: any[]) {
  if (!sql) return;

  for (const post of posts) {
    try {
      // Check if post already exists
      const [existing] = await sql`
        SELECT id FROM posts WHERE channel_id = ${channelId} AND telegram_message_id = ${post.telegramMessageId}
      `;
      if (existing) continue;

      // Generate embedding
      const embedding = await generateEmbedding(post.content);

      // Insert post
      await sql`
        INSERT INTO posts (channel_id, telegram_message_id, content, media_url, views, published_at, embedding)
        VALUES (
          ${channelId}, 
          ${post.telegramMessageId}, 
          ${post.content}, 
          ${post.mediaUrl || null}, 
          ${post.views}, 
          ${post.publishedAt},
          ${JSON.stringify(embedding)}
        )
      `;
    } catch (error) {
      console.error(`Error processing post ${post.telegramMessageId}:`, error);
    }
  }
}
