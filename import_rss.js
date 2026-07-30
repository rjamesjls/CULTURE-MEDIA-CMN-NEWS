const https = require('https');
const { Client } = require('pg');

const RSS_URL = 'https://culturemedianews.fr/?cat=26&feed=rss2';
const DB_URL = 'postgresql://postgres:Cmnjames973@*@db.cklwlxjutudysxapieev.supabase.co:5432/postgres';

function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .trim();
}

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function extractImageFromUrl(url) {
    try {
        const html = await fetchHTML(url);
        const imgMatches = html.match(/<img [^>]*src=["']([^"']+)["'][^>]*>/g);
        if (imgMatches) {
            for (const imgTag of imgMatches) {
                const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
                if (srcMatch && srcMatch[1].includes('wp-content/uploads') && !srcMatch[1].toUpperCase().includes('LOGO')) {
                    return srcMatch[1];
                }
            }
        }
    } catch (e) {
        console.error(`Failed to fetch image for ${url}:`, e.message);
    }
    return "/assets/hero_culture_article_1767385072389.png";
}

async function importRss() {
    console.log('Fetching RSS...');
    const xml = await fetchHTML(RSS_URL);
    
    // Quick regex based XML parsing for simplicity in Node without extra deps
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        
        const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
        const title = (titleMatch && (titleMatch[1] || titleMatch[2])) || 'No Title';
        
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const link = linkMatch ? linkMatch[1] : '';
        
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const pubDateStr = pubDateMatch ? pubDateMatch[1] : new Date().toUTCString();
        const pubDate = new Date(pubDateStr);
        
        const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
        const desc = (descMatch && (descMatch[1] || descMatch[2])) || '';
        
        const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
        const content = contentMatch ? contentMatch[1] : desc;
        
        console.log(`Extracting image for: ${title}`);
        const imageUrl = await extractImageFromUrl(link);
        
        items.push({
            title,
            slug: generateSlug(title),
            link,
            pub_date: pubDate,
            description: desc,
            content,
            image_url: imageUrl,
            category: 'Faits divers'
        });
    }
    
    console.log(`Found ${items.length} articles. Connecting to database...`);
    
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    
    for (const item of items) {
        try {
            await client.query(
                `INSERT INTO public.articles (title, slug, pub_date, description, content, image_url, category)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (slug) DO UPDATE SET
                 title = EXCLUDED.title,
                 content = EXCLUDED.content,
                 image_url = EXCLUDED.image_url`,
                [item.title, item.slug, item.pub_date, item.description, item.content, item.image_url, item.category]
            );
            console.log(`Imported: ${item.title}`);
        } catch (e) {
            console.error(`DB Error for ${item.slug}:`, e.message);
        }
    }
    
    await client.end();
    console.log('Import complete.');
}

importRss().catch(console.error);
