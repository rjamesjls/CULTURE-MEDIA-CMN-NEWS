import { NextResponse } from 'next/server';
import { recordImpression, recordClick } from '@/lib/ads';

export async function POST(request) {
  try {
    const { action, bannerId } = await request.json();

    if (!bannerId) {
      return NextResponse.json({ error: 'Missing bannerId' }, { status: 400 });
    }

    if (action === 'click') {
      await recordClick(bannerId);
    } else {
      await recordImpression(bannerId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
