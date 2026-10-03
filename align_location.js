const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /\{\/\* Breaking News Banner \*\/\}\n\s*<div style=\{\{ display: "flex", alignItems: "center", width: "100%", zIndex: 10, marginTop: "-20px" \}\}>\n\s*<div style=\{\{ background: "linear-gradient\(to right, #0d069b, #e41318\)", color: "#fff", padding: "10px 30px", fontSize: "48px", fontFamily: "'Anton', sans-serif", fontWeight: "normal", letterSpacing: "1px", display: "flex", alignItems: "center", position: "relative", zIndex: 2 \}\}>\n\s*<span style=\{\{ marginRight: "15px" \}\}>\(\(•\)\)<\/span> \{isBsh \? "SAN PASA NYUNSU" : "BREAKING NEWS"\}\n\s*<\/div>\n\s*<div style=\{\{ width: "40px", height: "70px", backgroundColor: "#fff", transform: "skewX\(-20deg\)", marginLeft: "-20px", zIndex: 1 \}\}><\/div>\n\s*<\/div>\n\n\s*\{\/\* Location Badge \*\/\}\n\s*<div style=\{\{ padding: "0 40px", marginTop: "15px", zIndex: 10 \}\}>\n\s*<div style=\{\{ display: "inline-flex", backgroundColor: "#ffce00", padding: "5px 25px 5px 15px", alignItems: "center", borderRadius: "4px", fontSize: "28px", fontWeight: "900", color: "#e41318", fontStyle: "italic" \}\}>\n\s*<span style=\{\{ marginRight: "10px", fontSize: "32px" \}\}>📍<\/span> CAYENNE\n\s*<\/div>\n\s*<\/div>/g;

const replacement = `{/* Breaking News & Location Banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", zIndex: 10, marginTop: "-20px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ background: "linear-gradient(to right, #0d069b, #e41318)", color: "#fff", padding: "10px 30px", fontSize: "48px", fontFamily: "'Anton', sans-serif", fontWeight: "normal", letterSpacing: "1px", display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
            <span style={{ marginRight: "15px" }}>((•))</span> {isBsh ? "SAN PASA NYUNSU" : "BREAKING NEWS"}
          </div>
          <div style={{ width: "40px", height: "70px", backgroundColor: "#fff", transform: "skewX(-20deg)", marginLeft: "-20px", zIndex: 1 }}></div>
        </div>

        {/* Location Badge */}
        <div style={{ paddingRight: "40px" }}>
          <div style={{ display: "inline-flex", backgroundColor: "#ffce00", padding: "5px 25px 5px 15px", alignItems: "center", borderRadius: "4px", fontSize: "28px", fontWeight: "900", color: "#e41318", fontStyle: "italic" }}>
            <span style={{ marginRight: "10px", fontSize: "32px" }}>📍</span> CAYENNE
          </div>
        </div>
      </div>`;

content = content.replace(targetRegex, replacement);
fs.writeFileSync(file, content);
