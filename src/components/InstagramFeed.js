import Image from 'next/image';
import Link from 'next/link';

export default async function InstagramFeed() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--color-gray-800)', borderRadius: '8px' }}>
        <p style={{ color: 'var(--color-gray-400)' }}>
          <i className="fab fa-instagram" style={{ fontSize: '24px', marginBottom: '10px' }}></i><br />
          Le flux Instagram n'est pas encore configuré (Clé API manquante).
        </p>
      </div>
    );
  }

  try {
    // Fetch posts and stories
    const res = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}&limit=6`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error('Failed to fetch Instagram feed');
    }

    const data = await res.json();
    const posts = data.data || [];

    if (posts.length === 0) {
      return null;
    }

    return (
      <div className="instagram-feed-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-white)', margin: 0 }}>
            <i className="fab fa-instagram" style={{ color: '#E1306C' }}></i> Suivez-nous sur Instagram
          </h3>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '10px' 
        }}>
          {posts.map((post) => (
            <Link key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', overflow: 'hidden', borderRadius: '8px', position: 'relative', aspectRatio: '1/1' }}>
              <img 
                src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url} 
                alt={post.caption?.substring(0, 50) || 'Instagram post'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                className="hover-zoom"
              />
              {post.media_type === 'VIDEO' && (
                <div style={{ position: 'absolute', top: '5px', right: '5px', color: 'white' }}>
                  <i className="fas fa-video"></i>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Instagram Feed Error:', error);
    return null; // Silent fail on UI
  }
}
