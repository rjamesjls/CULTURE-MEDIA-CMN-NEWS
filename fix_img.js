const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/instagram/custom/InstagramCustomClient.js';
let content = fs.readFileSync(filePath, 'utf-8');

const oldImageBlock = `                    {/* Thumbnail */}
                    {item.image && (
                      <div style={{ position: 'relative', marginRight: '16px', flexShrink: 0 }}>
                        <img 
                          src={item.image} 
                          style={{ 
                            width: isTop1 ? '64px' : '50px', 
                            height: isTop1 ? '64px' : '50px', 
                            borderRadius: '12px', 
                            objectFit: 'cover', 
                            border: isTop1 ? '2px solid #FBBF24' : '1px solid rgba(255,255,255,0.2)' 
                          }} 
                          crossOrigin="anonymous" 
                        />
                      </div>
                    )}`;

const newImageBlock = `                    {/* Thumbnail */}
                    <div style={{ position: 'relative', marginRight: '16px', flexShrink: 0, width: isTop1 ? '64px' : '50px', height: isTop1 ? '64px' : '50px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', border: isTop1 ? '2px solid #FBBF24' : '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }} 
                          onError={(e) => {
                            if (e.target.src && e.target.src.includes('maxresdefault.jpg')) {
                              e.target.src = e.target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                            } else if (e.target.src && e.target.src.includes('hqdefault.jpg')) {
                              e.target.src = e.target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                            } else {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: isTop1 ? '20px' : '16px', fontWeight: 'bold' }}>
                          {(item.title || 'CM')[0].toUpperCase()}
                        </span>
                      )}
                    </div>`;

if (content.includes(oldImageBlock)) {
  content = content.replace(oldImageBlock, newImageBlock);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("Updated template t4 image loading logic successfully!");
} else {
  console.log("Old image block not found in InstagramCustomClient.js");
}
