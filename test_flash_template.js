const renderTemplateFlash = (lang, ref, data) => {
    // We assume data has title, body, location, category, date, source
    const bgImage = "/backgrounds/bg-template-fr.png"; // Always blue for Flash? Or depends on lang?
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
        {/* HEADER */}
        <div style={{ padding: "0px 30px 14px 30px", display: "flex", alignItems: "stretch", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <img src="/afoluku-tv-logo.png" alt="AFOLUKU TV" style={{ height: "120px", objectFit: "contain", objectPosition: "left", marginTop: "-20px" }} crossOrigin="anonymous" />
            <div style={{ display: "flex", alignItems: "center", marginTop: "12px", gap: "14px" }}>
              <div style={{ backgroundColor: "#e41318", color: "#fff", padding: "1px 18px", borderRadius: "8px", fontWeight: "900", fontSize: "24px", letterSpacing: "2px", WebkitTextStroke: "1px #fff" }}>
                NEWS
              </div>
              <div style={{ fontSize: "19px", fontWeight: "600", color: "#fff", letterSpacing: "1px" }}>
                NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", paddingTop: "4px" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginTop: "24px" }}>
              {data.date}
            </div>
            <div style={{ backgroundColor: "#ffce00", color: "#000", padding: "6px 20px", fontWeight: "900", fontSize: "22px", borderRadius: "4px", textTransform: "uppercase" }}>
              {data.category}
            </div>
          </div>
        </div>

        {/* #FLASH & LOCATION */}
        <div style={{ display: "flex", alignItems: "center", gap: "25px", padding: "10px 35px", marginTop: "10px" }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontStyle: "italic", fontSize: "85px", color: "#fff", letterSpacing: "2px", lineHeight: "1", transform: "skewX(-15deg)" }}>
            #FLASH
          </div>
          <div style={{ backgroundColor: "#ffce00", padding: "6px 30px", display: "flex", alignItems: "center", gap: "12px", transform: "skewX(-15deg)" }}>
            <div style={{ transform: "skewX(15deg)", display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#e41318" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" fill="#e41318" stroke="none" />
              </svg>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: "40px", fontWeight: "900", color: "#e41318", display: "inline-block", whiteSpace: "nowrap" }}>
                {data.location}
              </span>
            </div>
          </div>
        </div>

        {/* TITLE */}
        <div style={{ padding: "10px 35px", color: "#fff", fontSize: "55px", fontWeight: "900", textTransform: "uppercase", textAlign: "left", lineHeight: "1.1" }}>
          {data.title}
        </div>

        {/* BODY (CENTERED) */}
        <div className={`insta-body ${lang}`} style={{ flex: 1, padding: "20px 50px", fontSize: "38px", lineHeight: "1.4", color: "#fff", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", textTransform: "uppercase", fontWeight: "800" }}
          dangerouslySetInnerHTML={{ __html: data.body }} />

        {/* SOURCE OVERLAY */}
        <div style={{ position: "absolute", bottom: "85px", left: "130px", display: "flex", alignItems: "center", zIndex: 20 }}>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "18px" }}>{data.source}</span>
        </div>
      </div>
    );
  };
