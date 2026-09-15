export const runtime = 'edge';

import { NextResponse } from 'next/server';

export interface YoutubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  viewCount?: number;
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
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );
    
    const data = await res.json() as any;

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'YouTube API Error' }, { status: res.status });
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Extrai os IDs dos 6 resultados para buscar as estatísticas
    const videoIds = data.items.map((item: any) => item.id.videoId).filter(Boolean);

    let statsMap: Record<string, number> = {};
    if (videoIds.length > 0) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${apiKey}`
      );
      const statsData = await statsRes.json() as any;
      if (statsRes.ok && statsData.items) {
        statsData.items.forEach((v: any) => {
          statsMap[v.id] = parseInt(v.statistics.viewCount || '0', 10);
        });
      }
    }

    const items: YoutubeSearchResult[] = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      viewCount: statsMap[item.id.videoId] || 0,
    }));

    // Algoritmo de Curadoria Híbrida: Relevância Estrita > ViewCount
    // Extrai o tópico principal se estiver entre aspas (ex: "Direitos Humanos")
    const topicMatch = query.match(/"([^"]+)"/);
    const strictTopic = topicMatch ? topicMatch[1].toLowerCase() : query.toLowerCase();
    
    // Pega palavras de peso (>= 4 letras) do tópico para validar relevância do título
    const topicWords = strictTopic.split(' ').filter(w => w.length >= 4);

    const isStrictlyRelevant = (title: string) => {
      const t = title.toLowerCase();
      // Se o tópico não tem palavras longas, assume relevante para não quebrar buscas curtas
      if (topicWords.length === 0) return true;
      return topicWords.some(w => t.includes(w));
    };

    // Ordena primeiro por Relevância, depois por ViewCount
    const topItems = items.sort((a, b) => {
      const aRel = isStrictlyRelevant(a.title) ? 1 : 0;
      const bRel = isStrictlyRelevant(b.title) ? 1 : 0;
      
      if (aRel !== bRel) return bRel - aRel;
      
      return (b.viewCount || 0) - (a.viewCount || 0);
    }).slice(0, 4);

    return NextResponse.json({ items: topItems });
  } catch (error: any) {
    console.error('Error fetching YouTube API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
