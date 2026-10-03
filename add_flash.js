const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const flashFunction = `
  const renderTemplateFlash = (lang, ref) => {
    const currentData = lang === "fr" ? templateData.fr : templateData.bsh;
    return (
      <div
        ref={ref}
        style={{
          width: "1080px",
          height: "1350px",
          backgroundColor: "#e41318",
          backgroundImage: "linear-gradient(135deg, #e41318 0%, #8b0000 100%)",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px", color: "white", textAlign: "center" }}>
          <h1 style={{ fontSize: "100px", fontFamily: "Anton, sans-serif", fontStyle: "italic", marginBottom: "40px", textTransform: "uppercase", letterSpacing: "4px", color: "#ffce00" }}>
            FLASH INFO
          </h1>
          <div style={{ fontSize: "50px", fontWeight: "900", lineHeight: "1.2", marginBottom: "30px", textShadow: "2px 2px 10px rgba(0,0,0,0.5)" }}>
            {currentData.title}
          </div>
          <div style={{ fontSize: "30px", lineHeight: "1.5", opacity: 0.9 }}>
            (Template Provisoire - En construction)
          </div>
        </div>
      </div>
    );
  };
`;

content = content.replace(/(const renderTemplate5 = [\s\S]*?\n  \};\n\n?)/, '$1' + flashFunction);

fs.writeFileSync(file, content);
