const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const newFlash = `  const renderTemplateFlash = (lang, ref) => {
    const flashData = templateData["template-flash"] || initialTemplateState;
    const isBsh = lang === "bsh";
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
        {/* Header (Même que Editorial) */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 40px", zIndex: 10, position: "relative", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <img src="/afoluku-tv-logo.png" alt="A FOLUKU TV" style={{ height: "110px", objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", marginTop: "5px", alignItems: "center" }}>
              <div style={{ backgroundColor: "#ffce00", color: "#e41318", padding: "2px 20px 4px 20px", fontWeight: "900", fontSize: "26px", borderRadius: "12px", lineHeight: "1" }}>
                FLASH
              </div>
              <div style={{ color: "#fff", fontSize: "20px", marginLeft: "15px", letterSpacing: "1px", fontWeight: "bold" }}>
                {isBsh ? "WI MEDIA, WI KULTURU, WI TOLI" : "NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES"}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu Central Provisoire */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px", color: "white", textAlign: "center", zIndex: 10 }}>
          <h1 style={{ fontSize: "100px", fontFamily: "Anton, sans-serif", fontStyle: "italic", marginBottom: "40px", textTransform: "uppercase", letterSpacing: "4px", color: "#ffce00", textShadow: "4px 4px 0px #000" }}>
            FLASH INFO
          </h1>
          <div style={{ fontSize: "50px", fontWeight: "900", lineHeight: "1.2", marginBottom: "30px", textShadow: "2px 2px 10px rgba(0,0,0,0.5)" }}>
            {lang === "fr" ? (flashData.title_fr || flashData.title) : (flashData.title_bsh || flashData.title)}
          </div>
        </div>

        {/* Footer (Breaking News + Lieu) */}
        {renderBreakingNewsBanner()}
      </div>
    );
  };`;

// Replace the old renderTemplateFlash block
content = content.replace(/const renderTemplateFlash = \([\s\S]*?\}\);\n  \};\n/g, newFlash + '\n');

fs.writeFileSync(file, content);
