const fs = require('fs');

let content = fs.readFileSync('restored_SocialGenerator.js', 'utf8');

// 1. Social Tabs
content = content.replace(/import \{ useRouter \} from \"next\/navigation\";/, 'import { useRouter } from "next/navigation";\nimport SocialTabs from "../SocialTabs";');
content = content.replace(/<style>\{\`[\s\S]*?\.admin-wrapper \{[\s\S]*?\}\n\s*\`\}<\/style>/, '');
content = content.replace(/<div style=\{pageHeaderStyle\}>[\s\S]*?<\/div>\n\s*<\/div>/, '<SocialTabs articleId={article.id} />');

// 2. Add back insta-body CSS (since step 1 stripped it all)
const styleBlock = `
      <style>{\`
        @import url("https://fonts.googleapis.com/css2?family=Anton&display=swap");
        /* Styles pour Instagram Post (wrap, points clés en jaune et très gras) */
        .insta-body {
          word-break: normal;
          overflow-wrap: break-word;
          white-space: pre-wrap !important;
        }
        .insta-body strong {
          font-weight: 900 !important;
        }
        .insta-body.fr strong {
          color: #ffce00 !important;
        }
        .insta-body.bsh strong {
          color: #e41318 !important; /* Red for better contrast on light background */
        }
        .insta-body ul {
          list-style-type: disc !important;
          padding-left: 40px !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        .insta-body ol {
          list-style-type: decimal !important;
          padding-left: 40px !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        .insta-body li {
          margin-bottom: 8px !important;
          display: list-item !important;
        }
        .insta-title {
          word-break: normal;
          overflow-wrap: break-word;
        }
      \`}</style>
`;
content = content.replace(/<SocialTabs articleId=\{article\.id\} \/>/, styleBlock + '<SocialTabs articleId={article.id} />');

// 3. templateData fix
const newInit = `  const [templateData, setTemplateData] = useState(() => {
    const base = {
      "template-1": { ...initialTemplateState },
      "template-2": { ...initialTemplateState },
      "template-3": { ...initialTemplateState, logoTheme: "black" },
      "template-4": { ...initialTemplateState },
      "template-5": { ...initialTemplateState },
      "template-flash": { ...initialTemplateState },
    };
    if (article.instagram_state?.templateData) {
      return { ...base, ...article.instagram_state.templateData };
    }
    return base;
  });`;
content = content.replace(/const \[templateData, setTemplateData\] = useState\(\(\) => \{[\s\S]*?\}\);\n/m, newInit + '\n');
content = content.replace(/const activeColors = colorThemes\[currentData\.themeColor\] \|\| colorThemes\.red;/g, 'const currentDataSafe = currentData || initialTemplateState;\n  const activeColors = colorThemes[currentDataSafe.themeColor] || colorThemes.red;');
content = content.replace(/const currentData = templateData\[activeTemplate\];/g, 'const currentData = templateData[activeTemplate] || initialTemplateState;');
content = content.replace(
  /useState\(article\.instagram_state\?\.selectedTemplateBsh \|\| \"template-3\"\);/g,
  'useState(article.instagram_state?.selectedTemplateBsh || "template-2");'
);

// 4. Dropdown Template UI Fix
content = content.replace(
  /\{\[\s*\{\s*id:\s*\"template-1\"[\s\S]*?\]\.map/g,
  `{[
                  { id: "template-2", label: "Éditorial AFOLUKU TV" },
                  { id: "template-flash", label: "Flash Info (Provisoire)" }
                ].map`
);

// 5. Sync the click handler
content = content.replace(
  /onClick=\{\(\) => \{\n\s*if \(activeLang === \"fr\"\) setSelectedTemplateFr\(tpl\.id\);\n\s*else setSelectedTemplateBsh\(tpl\.id\);\n\s*\}\}/g,
  `onClick={() => {
                      setSelectedTemplateFr(tpl.id);
                      setSelectedTemplateBsh(tpl.id);
                    }}`
);

// 6. renderTemplateFlash
const flashFunction = `  const renderTemplateFlash = (lang, ref) => {
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

        {/* Main Image (Optionnelle) */}
        <div style={{ width: "100%", height: proxiedImageUrl ? "450px" : "0px", position: "relative", zIndex: 5, marginTop: "10px", flexShrink: 0, overflow: "hidden", display: proxiedImageUrl ? "block" : "none" }}>
          {proxiedImageUrl && (
            <img
              src={proxiedImageUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              alt="Hero"
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Contenu Central Provisoire */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px", color: "white", textAlign: "center", zIndex: 10 }}>
          <h1 style={{ fontSize: "90px", fontFamily: "Anton, sans-serif", fontStyle: "italic", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "2px", color: "#ffce00", textShadow: "4px 4px 0px #000" }}>
            FLASH INFO
          </h1>
          <div 
            style={{ fontSize: "45px", fontWeight: "900", lineHeight: "1.2", marginBottom: "20px", textShadow: "2px 2px 10px rgba(0,0,0,0.5)" }}
            dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(lang === "fr" ? (flashData.title_fr || flashData.title) : (flashData.title_bsh || flashData.title)) }}
          />
        </div>

        {/* Breaking News & Location Banner */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", zIndex: 10, marginTop: "auto", marginBottom: "50px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ background: "linear-gradient(to right, #0d069b, #e41318)", color: "#fff", padding: "15px 30px", fontSize: "60px", fontFamily: "'Anton', sans-serif", fontStyle: "italic", letterSpacing: "2px", lineHeight: "1", display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
              <span style={{ marginRight: "15px", display: "flex", alignItems: "center" }}>
                <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
                  <path d="M8 8.5a5 5 0 0 0 0 7" />
                  <path d="M5 5.5a9 9 0 0 0 0 13" />
                  <path d="M16 8.5a5 5 0 0 1 0 7" />
                  <path d="M19 5.5a9 9 0 0 1 0 13" />
                </svg>
              </span> {isBsh ? "SAN PASA NYUNSU" : "BREAKING NEWS"}
            </div>
            <div style={{ width: "40px", height: "110px", backgroundColor: "#fff", transform: "skewX(-20deg)", marginLeft: "-20px", zIndex: 1 }}></div>
          </div>

          {/* Location Badge */}
          <div style={{ paddingRight: "0" }}>
            <div style={{ display: "inline-flex", backgroundColor: "#ffce00", padding: "5px 25px 5px 20px", alignItems: "center", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px", fontSize: "48px", fontWeight: "900", color: "#e41318", fontStyle: "italic" }}>
              <span style={{ marginRight: "15px", display: "flex", alignItems: "center" }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0d069b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                  <circle cx="12" cy="10" r="3" fill="#0d069b" stroke="none" />
                </svg>
              </span> <span style={{ background: "linear-gradient(to right, #0d069b, #e41318)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", paddingRight: "10px" }}>{flashData.location || "CAYENNE"}</span>
            </div>
          </div>
        </div>

        {/* Footer Source Text (absolute positioned over background) */}
        <div style={{ position: "absolute", bottom: "110px", left: "280px", zIndex: 20 }}>
          <div style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>
            {flashData.source || "A FOLUKU TV"}
          </div>
        </div>

        {/* Footer (Breaking News + Lieu) */}
        {renderBreakingNewsBanner()}
      </div>
    );
  };
`;

// Inject renderTemplateFlash right before `return (` of the component
// Since there are multiple "return (", we find the one before `<div style={pageContainerStyle}>`
content = content.replace(/\n\s*return \(\n\s*<>\n\s*<div style=\{pageContainerStyle\}>/, '\n' + flashFunction + '\n  return (\n    <>\n      <div style={pageContainerStyle}>');

// 7. Render it in the preview logic
content = content.replace(
  /\{selectedTemplateFr === \"template-5\" && renderTemplate5\(\"fr\", postRefFr\)\}/g,
  `{selectedTemplateFr === "template-5" && renderTemplate5("fr", postRefFr)}
                    {selectedTemplateFr === "template-flash" && renderTemplateFlash("fr", postRefFr)}`
);

content = content.replace(
  /\{selectedTemplateBsh === \"template-5\" && renderTemplate5\(\"bsh\", postRefBsh\)\}/g,
  `{selectedTemplateBsh === "template-5" && renderTemplate5("bsh", postRefBsh)}
                    {selectedTemplateBsh === "template-flash" && renderTemplateFlash("bsh", postRefBsh)}`
);

// Also fix recentArticles links since the diff showed it pointing to /instagram
content = content.replace(/href=\{\"\/admin\/articles\/\" \+ art\.id \+ \"\/instagram\"\}/g, 'href={"/admin/articles/" + art.id + "/social"}');

fs.writeFileSync('src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js', content);
