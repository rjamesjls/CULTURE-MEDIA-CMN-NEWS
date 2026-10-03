const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const bottomBanner = `
        {/* Breaking News & Location Banner */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", zIndex: 10, marginTop: "auto", marginBottom: "30px" }}>
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
`;

content = content.replace(/\{\/\* Footer Source Text \([\s\S]*?\{renderBreakingNewsBanner\(\)\}/, bottomBanner);

fs.writeFileSync(file, content);
