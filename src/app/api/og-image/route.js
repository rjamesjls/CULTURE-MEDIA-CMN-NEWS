import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const magazineSlug = searchParams.get('magazine');
    let imageUrl = searchParams.get('url');

    // 1. Resolve image URL from slug if needed
    if (!imageUrl && slug) {
      const { data: article } = await supabase
        .from('articles')
        .select('image_url')
        .eq('slug', slug)
        .maybeSingle();

      if (article?.image_url) {
        imageUrl = article.image_url;
      }
    }

    if (!imageUrl && (magazineSlug || slug)) {
      const targetSlug = magazineSlug || slug;
      const { data: magazine } = await supabase
        .from('magazines')
        .select('cover_image_url, image_url')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (magazine?.cover_image_url || magazine?.image_url) {
        imageUrl = magazine.cover_image_url || magazine.image_url;
      }
    }

    let inputBuffer = null;

    if (imageUrl) {
      if (imageUrl.startsWith('/')) {
        const localPath = path.join(process.cwd(), 'public', imageUrl);
        if (fs.existsSync(localPath)) {
          inputBuffer = fs.readFileSync(localPath);
        }
      } else {
        const res = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AFOLUKU-OG/1.0)',
          },
        });
        if (res.ok) {
          inputBuffer = Buffer.from(await res.arrayBuffer());
        }
      }
    }

    // Fallback to logo if image not available
    if (!inputBuffer) {
      const fallbackLogo = path.join(process.cwd(), 'public', 'afoluku-tv-logo.png');
      if (fs.existsSync(fallbackLogo)) {
        inputBuffer = fs.readFileSync(fallbackLogo);
      }
    }

    if (!inputBuffer) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Optimisation via Sharp pour WhatsApp, Facebook, LinkedIn, Twitter :
    // - Dimensions optimales : 1200 x 630 px
    // - Format : JPEG progressif (universellement supporté par 100% des clients mobiles)
    // - Poids : ~50 à 90 Ko (très inférieur à la limite stricte de 300 Ko de WhatsApp)
    const processedBuffer = await sharp(inputBuffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 78,
        progressive: true,
      })
      .toBuffer();

    return new NextResponse(processedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': processedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('OG Image Generation Error:', error);
    try {
      const fallbackLogo = path.join(process.cwd(), 'public', 'afoluku-tv-logo.png');
      const fallbackBuf = fs.readFileSync(fallbackLogo);
      const processedFallback = await sharp(fallbackBuf)
        .resize(1200, 630, { fit: 'contain', background: '#ffffff' })
        .jpeg({ quality: 80 })
        .toBuffer();

      return new NextResponse(processedFallback, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': processedFallback.length.toString(),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return new NextResponse('Internal error', { status: 500 });
    }
  }
}
