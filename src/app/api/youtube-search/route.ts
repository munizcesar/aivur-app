import { NextResponse } from 'next/server';

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key is missing' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=4&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );
    
    const data = await res.json() as any;

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'YouTube API Error' }, { status: res.status });
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const items: YoutubeSearchResult[] = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error fetching YouTube API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
