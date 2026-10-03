const fs = require('fs');

let content = fs.readFileSync('src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js', 'utf8');

// Add state
content = content.replace(/const \[quillKey, setQuillKey\] = useState\(0\);/, 'const [quillKey, setQuillKey] = useState(0);\n  const [customImage, setCustomImage] = useState(null);');

// Replace proxiedImageUrl with finalImageUrl in renderTemplateFlash
content = content.replace(/const renderTemplateFlash = \([\s\S]*?\{/\* Header \(Même que Editorial\) \*\//, `  const renderTemplateFlash = (lang, ref) => {
    const flashData = templateData["template-flash"] || initialTemplateState;
    const isBsh = lang === "bsh";
    const currentDataSafe = flashData;
    const activeColors = colorThemes[currentDataSafe.themeColor || "red"] || colorThemes.red;
    const displayedImage = customImage || proxiedImageUrl;

    return (
      <div
        ref={ref}
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: activeColors.main,
          backgroundImage: \`linear-gradient(135deg, \${activeColors.main} 0%, \${activeColors.gradEnd} 100%)\`,
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Background Image (Full Page) */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
          {displayedImage ? (
            <img
              src={displayedImage}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              alt="Hero"
              crossOrigin="anonymous"
            />
          ) : (
            <div style={{ width: "100%", height: "100%", backgroundColor: activeColors.main }}></div>
          )}
        </div>

        {/* Gradient Overlay (Top transparent, bottom solid color) */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: \`linear-gradient(to bottom, transparent 0%, \${activeColors.main}B3 50%, \${activeColors.gradEnd} 100%)\`, zIndex: 2 }}></div>

        {/* Header (Même que Editorial) */`);


// Inject Image Upload Field
const uploadField = `
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                Changer la photo de fond :
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                       setCustomImage(ev.target.result);
                    };
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
                className="admin-form-control"
              />
              {customImage && (
                <button
                  onClick={() => setCustomImage(null)}
                  style={{ marginTop: "5px", fontSize: "12px", color: "#e41318", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Retirer la photo personnalisée
                </button>
              )}
            </div>
`;

content = content.replace(/(<div style=\{\{ display: \"flex\", flexWrap: \"wrap\", gap: \"8px\" \}\}>\n\s*\{Object\.keys\(colorThemes\)\.map\([\s\S]*?\}\)\}\n\s*<\/div>\n\s*<\/div>)/, '$1' + uploadField);

fs.writeFileSync('src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js', content);
