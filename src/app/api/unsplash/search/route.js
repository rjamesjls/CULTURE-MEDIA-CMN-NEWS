import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY is missing' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API responded with ${response.status}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Return the regular sized image URL
      return NextResponse.json({ url: data.results[0].urls.regular });
    } else {
      return NextResponse.json({ error: 'No image found for this query' }, { status: 404 });
    }
  } catch (error) {
    console.error('Unsplash Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
