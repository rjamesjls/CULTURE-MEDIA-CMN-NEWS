import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Parser from 'rss-parser';

export const revalidate = 1800; // Cache for 30 minutes

export async function GET() {
  try {
    const supabase = await createClient();
    const parser = new Parser();

    // 1. Fetch all tracked channels
    const { data: channels, error: channelsError } = await supabase
      .from('youtube_channels')
      .select('channel_id, title, thumbnail_url, sector');

    if (channelsError) throw channelsError;
    if (!channels || channels.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const notifications = [];

    // 2. Fetch RSS feeds in parallel (with Promise.allSettled to ignore failing feeds)
    const fetchPromises = channels.map(async (channel) => {
      try {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channel_id}`;
        const feed = await parser.parseURL(feedUrl);
        
        feed.items.forEach(item => {
          const pubDate = new Date(item.pubDate);
          if (pubDate >= twoDaysAgo) {
            // Extract video ID from link: https://www.youtube.com/watch?v=VIDEO_ID
            const videoIdMatch = item.link.match(/v=([^&]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : item.id.split(':').pop();

            notifications.push({
              id: videoId,
              title: item.title,
              publishedAt: pubDate.toISOString(),
              channelId: channel.channel_id,
              channelTitle: channel.title,
              channelThumbnail: channel.thumbnail_url,
              sector: channel.sector,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              link: item.link
            });
          }
        });
      } catch (err) {
        console.error(`Error fetching RSS for channel ${channel.title}:`, err.message);
      }
    });

    await Promise.allSettled(fetchPromises);

    // 3. Sort by date descending (newest first)
    notifications.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
