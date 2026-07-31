import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function extractTag(xml, tag) {
  const openRegex = new RegExp(`<${tag}[^>]*>`, 'i');
  const closeTag = `</${tag}>`;
  const startMatch = xml.match(openRegex);
  if (!startMatch) return '';
  const startIndex = startMatch.index + startMatch[0].length;
  const endIndex = xml.indexOf(closeTag, startIndex);
  if (endIndex === -1) return '';
  let content = xml.substring(startIndex, endIndex).trim();
  if (content.startsWith('<![CDATA[')) {
    content = content.replace('<![CDATA[', '').replace(']]>', '');
  }
  return content.trim();
}

function extractAllTags(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const results = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
      let content = match[1].trim();
      if (content.startsWith('<![CDATA[')) {
          content = content.replace('<![CDATA[', '').replace(']]>', '');
      }
      if (tag === 'category' && !match[0].includes('domain="category"')) {
          continue;
      }
      results.push(content.trim());
  }
  return results;
}

// Map HTML entities to standard characters
function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

async function importArticles() {
  try {
    const xmlPath = path.resolve(__dirname, '../WP post/WordPress.2026-07-31 (1).xml');
    const xml = fs.readFileSync(xmlPath, 'utf8');

    const itemBlocks = xml.split('<item>').slice(1).map(block => block.split('</item>')[0]);
    console.log(`Found ${itemBlocks.length} items in XML.`);
    
    // Pass 1: Find all attachments (featured images)
    const attachments = {};
    for (const block of itemBlocks) {
       const type = extractTag(block, 'wp:post_type');
       if (type === 'attachment') {
           const id = extractTag(block, 'wp:post_id');
           const url = extractTag(block, 'wp:attachment_url');
           if (id && url) {
               attachments[id] = url;
           }
       }
    }
    console.log(`Found ${Object.keys(attachments).length} attachments.`);

    // Pass 2: Extract posts
    const posts = itemBlocks.filter(block => {
        const type = extractTag(block, 'wp:post_type');
        const status = extractTag(block, 'wp:status');
        return type === 'post' && status === 'publish';
    });
    
    let importedCount = 0;

    for (const block of posts) {
        let title = extractTag(block, 'title') || 'Sans titre';
        title = decodeHTMLEntities(title);
        // Sometimes title has <strong> etc. Strip them out for the title field
        title = title.replace(/(<([^>]+)>)/gi, "");

        let content = extractTag(block, 'content:encoded') || '';
        
        let excerpt = extractTag(block, 'excerpt:encoded') || '';
        
        const pubDateStr = extractTag(block, 'pubDate');
        const pubDate = pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString();
        const originalId = extractTag(block, 'wp:post_id');
        
        let slug = extractTag(block, 'wp:post_name');
        if (!slug || slug === '') {
            slug = slugify(title, { lower: true, strict: true });
        }
        slug = `${slug}-${originalId}`;

        const categories = extractAllTags(block, 'category');
        const category = categories.length > 0 ? decodeHTMLEntities(categories[0]) : 'Général';
        
        // Find featured image ID
        let imageUrl = '';
        const thumbnailMatch = block.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/);
        if (thumbnailMatch && thumbnailMatch[1]) {
            imageUrl = attachments[thumbnailMatch[1]] || '';
        }

        // Fallback to first image in content if not found
        if (!imageUrl) {
            // Find all src in img tags
            const imgRegex = /<img[^>]+src="([^">]+)"/g;
            let imgMatch;
            while ((imgMatch = imgRegex.exec(content)) !== null) {
                // Ignore emojis
                if (!imgMatch[1].includes('s.w.org/images/core/emoji')) {
                    imageUrl = imgMatch[1];
                    break;
                }
            }
        }

        let desc = excerpt;
        if (!desc && content) {
             desc = content.substring(0, 200).replace(/(<([^>]+)>)/gi, "");
        }
        // Clean up description
        desc = decodeHTMLEntities(desc).replace(/\t/g, '').replace(/\n/g, ' ').trim();
        if (desc.length > 195) desc = desc.substring(0, 195) + '...';

        const articleData = {
          slug,
          title,
          content,
          description: desc,
          pub_date: pubDate,
          category,
          image_url: imageUrl
        };

        const { error } = await supabase.from('articles').upsert(articleData, { onConflict: 'slug' });
        if (!error) importedCount++;
    }
    console.log(`Successfully updated ${importedCount} posts.`);
  } catch (err) {
    console.error('Failed:', err);
  }
}

importArticles();
