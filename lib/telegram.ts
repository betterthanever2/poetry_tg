import * as cheerio from 'cheerio';

export interface ScrapedChannel {
  username: string;
  name: string;
  avatarUrl: string;
  description: string;
  subscribers: number;
}

export interface ScrapedPost {
  telegramMessageId: number;
  content: string;
  publishedAt: string;
  views: number;
  mediaUrl?: string;
}

export async function scrapeTelegramChannel(username: string): Promise<{ channel: ScrapedChannel, posts: ScrapedPost[] }> {
  // Remove @ or https://t.me/ if present
  const cleanUsername = username.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '').replace(/\/$/, '');
  
  const url = `https://t.me/s/${cleanUsername}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch channel: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract channel info
  const name = $('.tgme_channel_info_header_title span').text().trim() || cleanUsername;
  const avatarUrl = $('.tgme_page_photo_image img').attr('src') || '';
  const description = $('.tgme_channel_info_description').text().trim() || '';
  
  // Try to parse subscribers (e.g., "12.5K subscribers")
  const subText = $('.tgme_channel_info_counters .tgme_channel_info_counter:contains("subscribers") .tgme_channel_info_counter_value').text().trim();
  let subscribers = 0;
  if (subText) {
    const numStr = subText.replace(/,/g, '').toUpperCase();
    if (numStr.endsWith('K')) subscribers = parseFloat(numStr) * 1000;
    else if (numStr.endsWith('M')) subscribers = parseFloat(numStr) * 1000000;
    else subscribers = parseInt(numStr, 10);
  }

  const channel: ScrapedChannel = {
    username: cleanUsername,
    name,
    avatarUrl,
    description,
    subscribers: isNaN(subscribers) ? 0 : subscribers,
  };

  // Extract posts
  const posts: ScrapedPost[] = [];
  $('.tgme_widget_message').each((i, el) => {
    const $el = $(el);
    const msgIdStr = $el.attr('data-post'); // e.g., "username/1234"
    if (!msgIdStr) return;
    
    const telegramMessageId = parseInt(msgIdStr.split('/')[1], 10);
    if (isNaN(telegramMessageId)) return;

    // Extract text content
    const contentHtml = $el.find('.tgme_widget_message_text').html();
    // Convert <br> to newlines and strip other tags
    let content = '';
    if (contentHtml) {
      content = contentHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    }

    // Skip empty posts (e.g., just a service message or unsupported media)
    if (!content) return;

    // Extract media (image)
    let mediaUrl = $el.find('.tgme_widget_message_photo_wrap').attr('style')?.match(/url\(['"]?(.*?)['"]?\)/)?.[1];
    if (!mediaUrl) {
      // Try video thumbnail
      mediaUrl = $el.find('.tgme_widget_message_video_thumb').attr('style')?.match(/url\(['"]?(.*?)['"]?\)/)?.[1];
    }

    // Extract date
    const dateStr = $el.find('.tgme_widget_message_date time').attr('datetime');
    const publishedAt = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();

    // Extract views
    const viewsText = $el.find('.tgme_widget_message_views').text().trim();
    let views = 0;
    if (viewsText) {
      const numStr = viewsText.toUpperCase();
      if (numStr.endsWith('K')) views = parseFloat(numStr) * 1000;
      else if (numStr.endsWith('M')) views = parseFloat(numStr) * 1000000;
      else views = parseInt(numStr, 10);
    }

    posts.push({
      telegramMessageId,
      content,
      publishedAt,
      views: isNaN(views) ? 0 : views,
      mediaUrl
    });
  });

  // Sort posts by date descending
  posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return { channel, posts };
}
