const fs = require('fs');
let c = fs.readFileSync('src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js', 'utf8');

// 1. Add to templateData state
c = c.replace(
  '"template-5": { ...initialTemplateState },',
  '"template-5": { ...initialTemplateState },\n      "template-afoluku": { ...initialTemplateState },'
);

// 2. Add to dropdown
c = c.replace(
  '{ id: "template-5", label: "Alerte Live (TV)" },',
  '{ id: "template-5", label: "Alerte Live (TV)" },\n                  { id: "template-afoluku", label: "\u00C9ditorial AFOLUKU TV" },'
);

// 3. Add render calls in preview (after template-5 render calls)
c = c.replace(
  '{selectedTemplateFr === "template-5" && renderTemplate5("fr", postRefFr)}',
  '{selectedTemplateFr === "template-5" && renderTemplate5("fr", postRefFr)}\n                    {selectedTemplateFr === "template-afoluku" && renderTemplateAfoluku("fr", postRefFr)}'
);
c = c.replace(
  '{selectedTemplateBsh === "template-5" && renderTemplate5("bsh", postRefBsh)}',
  '{selectedTemplateBsh === "template-5" && renderTemplate5("bsh", postRefBsh)}\n                    {selectedTemplateBsh === "template-afoluku" && renderTemplateAfoluku("bsh", postRefBsh)}'
);

// 4. Add the render function just before "return ("  (line 1852)
const renderFn = `
  const renderTemplateAfoluku = (lang, ref) => (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#ffffff",
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
        backgroundColor: "#fff",
        flexShrink: 0,
        borderBottom: "3px solid #e41318",
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <img src="/afoluku-tv-logo.png" alt="AFOLUKU TV" style={{ height: "80px", objectFit: "contain", objectPosition: "left" }} />
          <div style={{ display: "flex", alignItems: "center", marginTop: "6px", gap: "14px" }}>
            <div style={{ backgroundColor: "#e41318", color: "#fff", padding: "4px 18px", borderRadius: "4px", fontWeight: "900", fontSize: "22px", letterSpacing: "2px" }}>
              NEWS
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#444", letterSpacing: "0.5px" }}>
              {lang === "bsh" ? "WI MEDIA, WI KULTURU, WI TOLI" : "NOTRE M\u00C9DIA, NOS CULTURES, NOS HISTOIRES"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", paddingTop: "4px" }}>
          <div style={{ fontSize: "18px", color: "#555", fontWeight: "500" }}>{currentData.date}</div>
          <div style={{ backgroundColor: "#ffce00", color: "#000", padding: "5px 22px", borderRadius: "4px", fontWeight: "900", fontSize: "20px", textTransform: "uppercase" }}>
            {currentData[\`category_\${lang}\`]}
          </div>
        </div>
      </div>

      {/* ── PHOTO ── */}
      <div style={{ width: "100%", height: "470px", flexShrink: 0, overflow: "hidden" }}>
        {proxiedImageUrl
          ? <img src={proxiedImageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="" crossOrigin="anonymous" />
          : <div style={{ width: "100%", height: "100%", backgroundColor: "#e2e8f0" }} />
        }
      </div>

      {/* ── BREAKING NEWS BAND ── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ background: "linear-gradient(to right, #0d069b, #e41318)", color: "#fff", padding: "10px 28px", display: "flex", alignItems: "center", gap: "14px" }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
            <path d="M8 8.5a5 5 0 0 0 0 7" /><path d="M5 5.5a9 9 0 0 0 0 13" />
            <path d="M16 8.5a5 5 0 0 1 0 7" /><path d="M19 5.5a9 9 0 0 1 0 13" />
          </svg>
          <span style={{ fontFamily: "'Anton', sans-serif", fontStyle: "italic", fontSize: "50px", letterSpacing: "2px", lineHeight: "1" }}>
            {lang === "bsh" ? "SAN PASA NYUNSU" : "BREAKING NEWS"}
          </span>
        </div>
        <div style={{ backgroundColor: "#ffce00", padding: "8px 28px", display: "flex", alignItems: "center", gap: "14px" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0d069b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
            <circle cx="12" cy="10" r="3" fill="#0d069b" stroke="none" />
          </svg>
          <span style={{ fontFamily: "'Anton', sans-serif", fontStyle: "italic", fontSize: "42px", fontWeight: "900", background: "linear-gradient(to right, #0d069b, #e41318)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>
            {currentData.location || "CAYENNE"}
          </span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "22px 35px 15px 35px", backgroundColor: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* World map watermark */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "url(/backgrounds/world-map-dots.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.05 }} />
        <div className="insta-title" style={{ color: "#0d069b", fontSize: "40px", fontWeight: "900", lineHeight: "1.15", textTransform: "uppercase", marginBottom: "16px", position: "relative" }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[\`title_\${lang}\`]) }} />
        <div className={\`insta-body \${lang}\`} style={{ fontSize: "24px", lineHeight: "1.6", color: "#1a1a1a", flex: 1, overflow: "hidden", position: "relative", textAlign: "justify" }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[\`body_\${lang}\`]) }} />
        <div style={{ borderLeft: "4px solid #0d069b", paddingLeft: "14px", marginTop: "12px", fontStyle: "italic", fontSize: "20px", color: "#333", lineHeight: "1.4", position: "relative" }}>
          {lang === "bsh" ? "Yu sa go leisi ala sani fini fini na a web site : www.afolukutv.com" : "Plus de d\u00E9tails sur notre site web."}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ backgroundColor: "#0d069b", padding: "14px 25px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ backgroundColor: "#ffce00", color: "#000", padding: "3px 14px", borderRadius: "12px", fontWeight: "bold", fontSize: "15px" }}>Source</span>
            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>{currentData.source}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#ffce00", fontWeight: "700", fontSize: "15px" }}>
              {lang === "bsh" ? "FOLLOW " : "SUIVEZ "}<strong>AFOLUKU TV</strong>
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0 0 12.68 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.83 1.57V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12.166 2c-2.93 0-5.83 1.55-5.83 5.6v.83c-.49.1-1.04.42-1.04.92 0 .7.68 1.16 1.3 1.3-.2.63-.6 1.3-1.1 1.8-.56.56-.42 1.3.5 1.5.4.09.8.12 1.2.1.3.56.67 1.05 1.1 1.39-.1.08-.12.23-.05.35.1.17.4.26.78.26.5 0 1.16-.15 1.92-.15s1.42.15 1.92.15c.38 0 .68-.09.78-.26.07-.12.05-.27-.05-.35.43-.34.8-.83 1.1-1.39.4.02.8-.01 1.2-.1.92-.2 1.06-.94.5-1.5-.5-.5-.9-1.17-1.1-1.8.62-.14 1.3-.6 1.3-1.3 0-.5-.55-.82-1.04-.92v-.83C17.996 3.55 15.096 2 12.166 2z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <img src="/afoluku-tv-logo.png" alt="A FOLUKU TV" style={{ height: "55px", objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#ffce00", padding: "8px 18px", borderRadius: "6px" }}>
            <span style={{ color: "#000", fontWeight: "bold", fontSize: "17px" }}>
              {lang === "bsh" ? "Article compleet" : "Article complet"}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <div style={{ color: "#ffce00", fontSize: "15px", fontWeight: "bold" }}>WWW.AFOLUKUTV.COM</div>
        </div>
      </div>
    </div>
  );

`;

// Insert just before "  return ("  at line 1852 (the main component return)
c = c.replace(/\n  return \(\n    <>/, '\n' + renderFn + '  return (\n    <>');

fs.writeFileSync('src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js', c);
console.log('Done');
