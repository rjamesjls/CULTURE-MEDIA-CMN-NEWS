const fs = require('fs');
const filePath = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(filePath, 'utf-8');

const t2Start = '  const renderTemplate2 = (lang, ref) => (';
const t3Start = '  const renderTemplate3 = (lang, ref) => (';
const t4Start = '  const renderTemplate4 = (lang, ref) => (';

const extractBlock = (str, startStr, endStr) => {
    const startIndex = str.indexOf(startStr);
    if (startIndex === -1) return null;
    const endIndex = str.indexOf(endStr, startIndex);
    return { startIndex, endIndex: endIndex };
};

const t2Block = extractBlock(content, t2Start, t3Start);
const t3Block = extractBlock(content, t3Start, t4Start);

if (!t2Block || !t3Block) {
    console.error("Could not find blocks");
    process.exit(1);
}

// Generate new code
const generateTemplate = (templateName, lang) => {
    return `  const ${templateName} = (lang, ref) => {
    const isBsh = lang === "bsh";
    return (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#06038D", // Deep blue background
        background: "linear-gradient(180deg, #010023 0%, #06038D 25%, #0A11DE 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Montserrat", sans-serif',
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Background World Map or pattern can go here if needed */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.05, backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "30px 40px", zIndex: 10, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Logo Simulation */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#fff", fontSize: "50px", fontWeight: "900", fontStyle: "italic", letterSpacing: "-1px" }}>
              <span style={{ color: "#fff" }}>A</span>FOLUKU
              <span style={{ backgroundColor: "#FDE100", color: "#000", padding: "0 8px", borderRadius: "4px", marginLeft: "5px", display: "inline-block", transform: "skewX(-10deg)" }}>TV</span>
            </span>
          </div>
          <div style={{ display: "flex", marginTop: "5px", alignItems: "center" }}>
            <div style={{ backgroundColor: "#E60000", color: "#fff", padding: "4px 15px", fontWeight: "bold", fontSize: "20px", borderRadius: "4px" }}>
              NEWS
            </div>
            <div style={{ color: "#fff", fontSize: "15px", marginLeft: "15px", letterSpacing: "1px" }}>
              {isBsh ? "WI MEDIA, WI KULTURU, WI TOLI" : "NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-start" }}>
          <div style={{ color: "#fff", fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
            {currentData.date}
          </div>
          <div style={{ backgroundColor: "#FDE100", color: "#000", padding: "5px 20px", fontWeight: "900", fontSize: "24px", borderRadius: "8px" }}>
            {currentData[\`category_\${lang}\`] || (isBsh ? "POLITIKI" : "POLITIQUE")}
          </div>
        </div>
      </div>

      {/* Main Image */}
      <div style={{ width: "100%", height: "450px", position: "relative", zIndex: 5, marginTop: "10px" }}>
        <img
          src={proxiedImageUrl || "/backgrounds/editorial-blue-bg.png"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt="Hero"
          crossOrigin="anonymous"
        />
        {/* Placeholder for over-image text if they don't upload it pre-rendered */}
        <div style={{ position: "absolute", bottom: "20px", left: "0", display: "flex" }}>
          {/* We leave this empty assuming image has the text, or add a red badge */}
          <div style={{ backgroundColor: "#E60000", color: "#fff", padding: "5px 15px", fontSize: "24px", fontWeight: "bold", borderTopRightRadius: "5px", borderBottomRightRadius: "5px" }}>
            239 voix
          </div>
        </div>
      </div>

      {/* Breaking News Banner */}
      <div style={{ display: "flex", alignItems: "center", width: "100%", zIndex: 10, marginTop: "-20px" }}>
        <div style={{ backgroundColor: "#E60000", color: "#fff", padding: "10px 30px", fontSize: "36px", fontWeight: "900", fontStyle: "italic", display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
          <span style={{ marginRight: "15px" }}>((•))</span> {isBsh ? "SAN PASA NYUNSU" : "BREAKING NEWS"}
        </div>
        <div style={{ width: "40px", height: "70px", backgroundColor: "#fff", transform: "skewX(-20deg)", marginLeft: "-20px", zIndex: 1 }}></div>
        <div style={{ flex: 1, height: "15px", backgroundColor: "#E60000" }}></div>
      </div>

      {/* Location Badge */}
      <div style={{ padding: "0 40px", marginTop: "15px", zIndex: 10 }}>
        <div style={{ display: "inline-flex", backgroundColor: "#FDE100", padding: "5px 25px 5px 15px", alignItems: "center", borderRadius: "4px", fontSize: "28px", fontWeight: "900", color: "#E60000", fontStyle: "italic" }}>
          <span style={{ marginRight: "10px", fontSize: "32px" }}>📍</span> CAYENNE
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: "30px 40px", flex: 1, zIndex: 10, display: "flex", flexDirection: "column" }}>
        {/* Title */}
        <div
          style={{
            color: "#FDE100",
            fontSize: "42px",
            fontWeight: "900",
            textTransform: "uppercase",
            lineHeight: "1.1",
            marginBottom: "20px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
          }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[\`title_\${lang}\`]) }}
        />
        
        {/* Body */}
        <div
          style={{
            color: "#fff",
            fontSize: "26px",
            lineHeight: "1.4",
            fontWeight: "500",
            marginBottom: "30px",
            textShadow: "1px 1px 3px rgba(0,0,0,0.5)"
          }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[\`body_\${lang}\`]) }}
        />

        {/* Quote Line */}
        <div style={{ display: "flex", alignItems: "center", marginTop: "auto", marginBottom: "20px" }}>
          <div style={{ width: "6px", height: "50px", backgroundColor: "#FDE100", marginRight: "20px" }}></div>
          <div style={{ color: "#fff", fontSize: "24px", fontStyle: "italic", fontWeight: "600" }}>
            {isBsh ? "Yu sa go leisi ala sani fini fini na a web site :" : "Plus de détails sur notre site web."}
            {isBsh && <div style={{fontWeight: "400"}}>www.afolukutv.com</div>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", backgroundColor: "#010023", padding: "20px 40px", alignItems: "center", justifyContent: "space-between", borderTop: "2px solid rgba(255,255,255,0.1)", zIndex: 10 }}>
        
        {/* Left: Source & Socials */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ backgroundColor: "#FDE100", color: "#000", padding: "3px 12px", borderRadius: "12px", fontSize: "16px", fontWeight: "bold" }}>
              Source
            </div>
            <div style={{ color: "#fff", fontSize: "18px" }}>
              {currentData.source || "Sénat"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
            <div style={{ color: "#fff", fontSize: "14px", fontWeight: "bold", letterSpacing: "1px" }}>
              {isBsh ? "FOLLOW AFOLUKU TV" : "SUIVEZ AFOLUKU TV"}
            </div>
            {/* Social Icons simulation */}
            <div style={{ display: "flex", gap: "6px" }}>
              {['📷', 'f', '🎵', '👻', '▶', '💬'].map(icon => (
                <div key={icon} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px" }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Logo */}
        <div style={{ fontSize: "60px", color: "#fff", fontWeight: "900", fontStyle: "italic" }}>
          A
        </div>

        {/* Right: Read More */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", marginBottom: "5px" }}>
            {isBsh ? "Article compleet" : "Article complet"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ color: "#FDE100", fontSize: "24px" }}>➔</div>
            <div style={{ backgroundColor: "#FDE100", color: "#000", padding: "5px 15px", borderRadius: "4px", fontSize: "18px", fontWeight: "900" }}>
              WWW.AFOLUKUTV.COM
            </div>
          </div>
        </div>

      </div>
    </div>
  );
  }
`;
};

const newT2 = generateTemplate('renderTemplate2', 'fr');
const newT3 = generateTemplate('renderTemplate3', 'bsh');

let newContent = content.substring(0, t2Block.startIndex) + newT2 + "\n" + newT3 + "\n" + content.substring(t3Block.endIndex);

fs.writeFileSync(filePath, newContent);
console.log("Replaced template 2 and 3 successfully.");
