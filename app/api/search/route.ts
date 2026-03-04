import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDbInitialized } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!sql) {
    return NextResponse.json([]);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json([]);
    }

    await ensureDbInitialized();
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(q);

    // Perform vector similarity search using pgvector's cosine distance (<=>)
    // We order by distance ascending (closest first) and limit to top 20 results
    const results = await sql`
      SELECT 
        id, 
        channel_id as "channelId", 
        content, 
        media_url as "mediaUrl", 
        views, 
        published_at as "publishedAt",
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}) as similarity
      FROM posts
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}
      LIMIT 20
    `;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching posts:', error);
    return NextResponse.json([]);
  }
}
