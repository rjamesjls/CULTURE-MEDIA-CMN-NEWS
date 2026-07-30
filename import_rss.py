import urllib.request
import xml.etree.ElementTree as ET
import re
import os
from datetime import datetime

RSS_URL = 'https://culturemedianews.fr/?cat=26&feed=rss2'
TEMPLATE_FILE = 'article.html'
OUTPUT_DIR = '.'

def generate_slug(title):
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug

def parse_date(date_str):
    try:
        dt = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S %z')
        return dt.strftime('%d %B %Y')
    except:
        return date_str

def extract_image_from_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
        imgs = re.findall(r'<img [^>]*src=[\"\']([^\"\']+)[\"\'][^>]*>', html)
        for img in imgs:
            if 'wp-content/uploads' in img and 'LOGO' not in img.upper():
                return img
    except Exception as e:
        print(f"Failed to fetch image for {url}: {e}")
    return "./assets/hero_culture_article_1767385072389.png" # default fallback

def fetch_rss():
    req = urllib.request.Request(RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    xml_data = response.read().decode('utf-8')
    
    xml_start = xml_data.find('<?xml')
    if xml_start != -1:
        xml_data = xml_data[xml_start:]
        
    root = ET.fromstring(xml_data)
    
    items = []
    ns = {'content': 'http://purl.org/rss/1.0/modules/content/'}
    
    for item in root.findall('./channel/item'):
        title = item.find('title').text
        link = item.find('link').text
        pub_date = item.find('pubDate').text
        
        desc_elem = item.find('description')
        desc = desc_elem.text if desc_elem is not None else ''
        
        content_elem = item.find('content:encoded', ns)
        content = content_elem.text if content_elem is not None else desc
        
        print(f"Extraction de l'image pour: {title}")
        image_url = extract_image_from_url(link)
        
        items.append({
            'title': title,
            'link': link,
            'pub_date': pub_date,
            'description': desc,
            'content': content,
            'image_url': image_url
        })
    return items

def generate_articles():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
        template = f.read()
        
    items = fetch_rss()
    print(f"Trouvé {len(items)} articles dans le flux RSS.")
    
    for item in items:
        slug = generate_slug(item['title'])
        filename = f"faits-divers-{slug}.html"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        html = template
        
        html = re.sub(r'<title>.*?</title>', f'<title>{item["title"]} | Culture Média News</title>', html, flags=re.DOTALL)
        html = re.sub(r'<h1 class="article-title">.*?</h1>', f'<h1 class="article-title">{item["title"]}</h1>', html, flags=re.DOTALL)
        
        body_start = html.find('<div class="article-body">')
        if body_start != -1:
            body_start += len('<div class="article-body">')
            body_end = html.find('<!-- Tags -->', body_start)
            if body_end != -1:
                body_end = html.rfind('</div>', body_start, body_end)
                new_body = f"\n{item['content']}\n"
                html = html[:body_start] + new_body + html[body_end:]

        formatted_date = parse_date(item['pub_date'])
        html = re.sub(r'<time datetime="[^"]*">.*?</time>', f'<time datetime="{item["pub_date"]}">{formatted_date}</time>', html)
        
        html = html.replace('<span class="badge">Culture</span>', '<span class="badge">Faits divers</span>')

        # Replace all instances of the placeholder images with the actual image
        html = re.sub(r'src="\./assets/hero_[^"]+\.png"', f'src="{item["image_url"]}"', html)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
            
        print(f"Généré : {filepath}")
        
    generate_index_page(items)

def generate_index_page(items):
    with open('index.html', 'r', encoding='utf-8') as f:
        idx = f.read()
        
    start = idx.find('<!-- À LA UNE SECTION -->')
    end = idx.find('<!-- DOSSIERS & ENQUÊTES -->')
    
    if start != -1 and end != -1:
        new_section = '''
    <section class="section featured-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Faits divers (Importés)</h2>
            </div>
            <div class="grid grid-4 featured-grid">
'''
        for item in items:
            slug = generate_slug(item['title'])
            filename = f"faits-divers-{slug}.html"
            new_section += f'''
                <article class="card article-card">
                    <div class="card-image-wrapper">
                        <img src="{item['image_url']}" alt="{item['title']}" class="card-image" loading="lazy" style="height:200px; object-fit:cover;">
                        <span class="badge card-badge">Faits divers</span>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">
                            <a href="{filename}">{item['title']}</a>
                        </h3>
                        <div class="card-meta">
                            <span><i class="far fa-clock"></i> {parse_date(item['pub_date'])}</span>
                        </div>
                    </div>
                </article>
'''
        new_section += '''
            </div>
        </div>
    </section>
'''
        idx = idx[:start] + new_section + idx[end:]
        with open('faits-divers.html', 'w', encoding='utf-8') as f:
            f.write(idx)
        print("Généré : faits-divers.html")

if __name__ == '__main__':
    generate_articles()
