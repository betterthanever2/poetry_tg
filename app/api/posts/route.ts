import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDbInitialized } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json([]);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channelId');

    await ensureDbInitialized();
    let posts;
    if (channelId) {
      posts = await sql`
        SELECT id, channel_id as "channelId", content, media_url as "mediaUrl", views, published_at as "publishedAt"
        FROM posts
        WHERE channel_id = ${channelId}
        ORDER BY published_at DESC
        LIMIT 50
      `;
    } else {
      posts = await sql`
        SELECT id, channel_id as "channelId", content, media_url as "mediaUrl", views, published_at as "publishedAt"
        FROM posts
        ORDER BY published_at DESC
        LIMIT 50
      `;
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json([]);
  }
}
