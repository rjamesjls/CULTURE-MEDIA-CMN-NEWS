const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const t2Start = lines.findIndex(l => l.includes('const renderTemplate2 ='));
const t4Start = lines.findIndex(l => l.includes('const renderTemplate4 ='));

if (t2Start === -1 || t4Start === -1) {
  console.log('Error finding markers');
  process.exit(1);
}

const replacement = `
  const renderTemplate2 = (lang, ref) => {
    const isBsh = lang === "bsh";
    const bgImage = isBsh ? "/backgrounds/bg-template-bsh.png" : "/backgrounds/bg-template-fr.png";
    const subtitle = isBsh ? "WI MEDIA, WI KULTURU, WI TOLI" : "NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES";
    const category = currentData[\`category_\${lang}\`] || (isBsh ? "POLITIKI" : "POLITIQUE");
    const readMore = isBsh ? "Yu sa go leisi ala sani fini fini na a web site : www.afolukutv.com" : "Plus de détails sur notre site web.";
    const articleBtn = isBsh ? "Article compleet" : "Article complet";
    const titleColor = isBsh ? "#ffffff" : "#0d069b";
    const bodyColor = isBsh ? "#ffffff" : "#1a1a1a";
    const breakingText = isBsh ? "SAN PASA NYUNSU" : "BREAKING NEWS";
    const sourceText = isBsh ? "FOLLOW " : "SUIVEZ ";

    return (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundImage: \`url(\${bgImage})\`,
        backgroundColor: "#ffffff",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Montserrat", sans-serif',
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{
        padding: "18px 30px 14px 30px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        {/* Left: Logo + NEWS badge + Tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <img src="/afoluku-tv-logo.png" alt="AFOLUKU TV" style={{ height: "80px", objectFit: "contain", objectPosition: "left" }} crossOrigin="anonymous" />
          <div style={{ display: "flex", alignItems: "center", marginTop: "6px", gap: "14px" }}>
            <div style={{ backgroundColor: "#e41318", color: "#fff", padding: "4px 18px", borderRadius: "4px", fontWeight: "900", fontSize: "22px", letterSpacing: "2px" }}>
              NEWS
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: isBsh ? "#fff" : "#444", letterSpacing: "0.5px" }}>
              {subtitle}
            </div>
          </div>
        </div>
        {/* Right: Date + Category */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", paddingTop: "4px" }}>
          <div style={{ fontSize: "18px", fontWeight: "700", color: isBsh ? "#fff" : "#333" }}>
            {currentData.date}
          </div>
          <div style={{ backgroundColor: "#ffce00", color: "#000", padding: "6px 20px", fontWeight: "900", fontSize: "22px", borderRadius: "4px" }}>
            {category}
          </div>
        </div>
      </div>

      {/* ── MAIN IMAGE ── */}
      <div style={{ width: "100%", height: "500px", position: "relative", flexShrink: 0, overflow: "hidden" }}>
        {proxiedImageUrl && (
          <img
            src={proxiedImageUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            alt="Hero"
            crossOrigin="anonymous"
          />
        )}
      </div>

      {/* ── BREAKING NEWS BANNER ── */}
      <div style={{ display: "flex", alignItems: "stretch", width: "100%", flexShrink: 0 }}>
        {/* Left red gradient block with broadcast icon + text */}
        <div style={{
          background: "linear-gradient(to right, #0d069b, #e41318)",
          color: "#fff",
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
            <path d="M8 8.5a5 5 0 0 0 0 7" /><path d="M5 5.5a9 9 0 0 0 0 13" />
            <path d="M16 8.5a5 5 0 0 1 0 7" /><path d="M19 5.5a9 9 0 0 1 0 13" />
          </svg>
          <span style={{ fontFamily: "'Anton', sans-serif", fontStyle: "italic", fontSize: "50px", letterSpacing: "2px", lineHeight: "1" }}>
            {breakingText}
          </span>
        </div>
      </div>

      {/* ── LOCATION BADGE ── */}
      <div style={{ backgroundColor: "#ffce00", padding: "8px 28px", display: "flex", alignItems: "center", gap: "14px", flexShrink: 0, width: "fit-content" }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0d069b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" fill="#0d069b" stroke="none" />
        </svg>
        <span style={{ fontFamily: "'Anton', sans-serif", fontStyle: "italic", fontSize: "42px", fontWeight: "900", background: "linear-gradient(to right, #0d069b, #e41318)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>
          {currentData.location || "CAYENNE"}
        </span>
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ flex: 1, padding: "22px 35px 15px 35px", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* Title */}
        <div className="insta-title" style={{ color: titleColor, fontSize: "40px", fontWeight: "900", lineHeight: "1.15", textTransform: "uppercase", marginBottom: "16px", position: "relative" }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[\`title_\${lang}\`]) }} />
        {/* Body */}
        <div className={\`insta-body \${lang}\`} style={{ fontSize: "24px", lineHeight: "1.6", color: bodyColor, flex: 1, overflow: "hidden", position: "relative", textAlign: "justify" }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[\`body_\${lang}\`]) }} />
        {/* Italic CTA */}
        <div style={{ borderLeft: \`4px solid \${isBsh ? '#ffce00' : '#0d069b'}\`, paddingLeft: "14px", marginTop: "12px", fontStyle: "italic", fontSize: "20px", color: isBsh ? "#fff" : "#333", lineHeight: "1.4", position: "relative" }}>
          {readMore}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ backgroundColor: "#0d069b", padding: "14px 25px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        {/* Left: Source + Follow + Social icons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ backgroundColor: "#ffce00", color: "#000", padding: "3px 14px", borderRadius: "12px", fontWeight: "bold", fontSize: "15px" }}>Source</span>
            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>{currentData.source}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#ffce00", fontWeight: "700", fontSize: "15px" }}>
              {sourceText}<strong>AFOLUKU TV</strong>
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Social SVG icons */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0 0 12.68 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.83 1.57V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12.166 2c-2.93 0-5.83 1.55-5.83 5.6v.83c-.49.1-1.04.42-1.04.92 0 .7.68 1.16 1.3 1.3-.2.63-.6 1.3-1.1 1.8-.56.56-.42 1.3.5 1.5.4.09.8.12 1.2.1.3.56.67 1.05 1.1 1.39-.1.08-.12.23-.05.35.1.17.4.26.78.26.5 0 1.16-.15 1.92-.15s1.42.15 1.92.15c.38 0 .68-.09.78-.26.07-.12.05-.27-.05-.35.43-.34.8-.83 1.1-1.39.4.02.8-.01 1.2-.1.92-.2 1.06-.94.5-1.5-.5-.5-.9-1.17-1.1-1.8.62-.14 1.3-.6 1.3-1.3 0-.5-.55-.82-1.04-.92v-.83C17.996 3.55 15.096 2 12.166 2z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </div>
          </div>
        </div>

        {/* Center: A logo */}
        <div style={{ flexShrink: 0 }}>
          <img src="/afoluku-tv-logo.png" alt="A FOLUKU TV" style={{ height: "55px", objectFit: "contain" }} crossOrigin="anonymous" />
        </div>

        {/* Right: Article complet */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#ffce00", padding: "8px 18px", borderRadius: "6px" }}>
            <span style={{ color: "#000", fontWeight: "bold", fontSize: "17px" }}>
              {articleBtn}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <div style={{ color: "#ffce00", fontSize: "15px", fontWeight: "bold" }}>WWW.AFOLUKUTV.COM</div>
        </div>
      </div>
    </div>
    );
  };
`;

const newLines = [
  ...lines.slice(0, t2Start),
  replacement,
  ...lines.slice(t4Start)
];

fs.writeFileSync(file, newLines.join('\n'));
console.log('Replaced successfully');
