import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('/Users/studiojls/.gemini/antigravity/brain/9d831544-f280-47a4-a9f1-0757b76be07a/.system_generated/steps/2157/content.md', 'utf-8');
const $ = cheerio.load(html);

const articles = [];
$('article').each((i, el) => {
  const title = $(el).find('h3 a, h2 a, h4 a, h5 a, h1 a, .title a').first().text().trim();
  const link = $(el).find('h3 a, h2 a, h4 a, h5 a, h1 a, .title a').first().attr('href');
  if (title && link) {
    articles.push({ title, link });
  }
});

console.log(JSON.stringify(articles, null, 2));
