const fs = require('fs');

let content = fs.readFileSync('src/app/admin/(dashboard)/articles/[id]/instagram/InstagramGenerator.js', 'utf8');

// 1. Update signature to include recentArticles
content = content.replace(
  'export default function InstagramGenerator({ article }) {',
  'export default function InstagramGenerator({ article, recentArticles = [] }) {'
);

// 2. Add handlePublish and handleGenerateCaption functions
const functions = `
  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const res = await generateCaption(article);
      if (res.success) {
        setPublishCaption(res.caption);
      } else {
        alert("Erreur de génération: " + res.error);
      }
    } catch (e) {
      alert("Erreur: " + e.message);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handlePublish = async () => {
    if (!publishCaption) {
      alert("Veuillez générer ou rédiger une légende.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Obtenir les deux images
      const base64Fr = await getCanvasImage("fr");
      const base64Bsh = await getCanvasImage("bsh");
      
      if (!base64Fr || !base64Bsh) {
        alert("Erreur de génération des images.");
        setIsPublishing(false);
        return;
      }
      
      const formData = new FormData();
      if (carouselOrder === "fr-first") {
        formData.append("base64Image1", base64Fr);
        formData.append("base64Image2", base64Bsh);
      } else {
        formData.append("base64Image1", base64Bsh);
        formData.append("base64Image2", base64Fr);
      }
      
      formData.append("caption", publishCaption);
      formData.append("instagramTags", instagramTags);
      formData.append("articleId", article.id);
      
      const res = await publishToMeta(formData);
      
      if (res.success) {
        alert("Publication réussie sur Meta !");
      } else {
        alert("Erreur: " + res.error);
      }
    } catch (e) {
      alert("Erreur système: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const getCanvasImage = async (lang) => {
    try {
      const ref = lang === "fr" ? postRefFr : postRefBsh;
      if (!ref.current) return null;
      
      // Petit hack pour forcer le bon rendu
      const node = ref.current;
      return await htmlToImage.toJpeg(node, {
        quality: 1.0,
        pixelRatio: 2,
        width: 1080,
        height: 1350,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };
`;

// Insert functions before 'const getInitialBody'
content = content.replace('  const getInitialBody = () => {', functions + '\n  const getInitialBody = () => {');

// 3. Add the third column layout. 
// We find `<div style={previewContainerStyle}>` and we inject a third column after it.
const thirdColumn = `
          {/* Colonne de droite : Publish Meta et Autres articles */}
          <div style={{ width: "300px", display: "flex", flexDirection: "column", borderLeft: "1px solid #e5e7eb", backgroundColor: "#fff", overflowY: "auto" }}>
            
            {/* PUBLISH META BLOCK */}
            <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: "600", fontSize: "14px", color: "#374151", marginBottom: "15px" }}>Publier sur Instagram</div>
              
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "5px", color: "#4b5563" }}>
                  Ordre du Carrousel :
                </label>
                <select 
                  value={carouselOrder} 
                  onChange={(e) => setCarouselOrder(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                >
                  <option value="fr-first">FR en premier, puis BSH</option>
                  <option value="bsh-first">BSH en premier, puis FR</option>
                </select>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "5px", color: "#4b5563" }}>
                  Taguer (Instagram) :
                </label>
                <input
                  type="text"
                  value={instagramTags}
                  onChange={(e) => setInstagramTags(e.target.value)}
                  placeholder="@culturemediacmn"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#4b5563" }}>
                  Légende :
                </label>
                <button
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                  style={{
                    background: "none",
                    border: "1px solid #d8b4fe",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "#f3e8ff",
                    color: "#7e22ce",
                    padding: "4px 8px",
                    fontSize: "11px"
                  }}
                >
                  {isGeneratingCaption ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-magic"></i>
                  )}{" "}
                  IA
                </button>
              </div>

              <textarea
                value={publishCaption}
                onChange={(e) => setPublishCaption(e.target.value)}
                placeholder="Légende du post..."
                rows={8}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  resize: "vertical",
                  marginBottom: "15px"
                }}
              />
              
              <button
                onClick={handlePublish}
                disabled={isPublishing || isSaving}
                className="admin-btn"
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  color: "white", 
                  border: "none",
                  fontWeight: "bold",
                  cursor: (isPublishing || isSaving) ? "not-allowed" : "pointer",
                  opacity: (isPublishing || isSaving) ? 0.7 : 1
                }}
              >
                {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-instagram"></i>}
                {" "}Publier
              </button>
            </div>

            {/* AUTRES ARTICLES BLOCK */}
            <div style={{ flex: 1 }}>
              <div style={{ padding: "15px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb", position: "sticky", top: 0, zIndex: 10 }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#111827" }}>
                  <i className="fas fa-list-ul" style={{ marginRight: "8px" }}></i>
                  Autres articles
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recentArticles.map((art) => (
                  <a
                    key={art.id}
                    href={"/admin/articles/" + art.id + "/instagram"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 15px",
                      borderBottom: "1px solid #f3f4f6",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ width: "40px", height: "40px", flexShrink: 0, borderRadius: "4px", overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                      {art.image_url ? (
                        <img src={art.image_url} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "500", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {art.title}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    </>
`;

// we find the end of the preview container.
// It ends with:
/*
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
*/
const targetEnding = `
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
`;

const newEnding = thirdColumn + `
  );
}
`;

content = content.replace(targetEnding, newEnding);

fs.writeFileSync('src/app/admin/(dashboard)/articles/[id]/instagram/InstagramGenerator.js', content);
console.log("Patched successfully!");
