const fs = require('fs');
let content = fs.readFileSync('src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js', 'utf8');

const oldLogo = `        {/* Logo */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src={
              currentData.logoTheme === "black"
                ? "/backgrounds/cmn-corner-logo-black.png"
                : "/backgrounds/cmn-corner-logo.png"
            }
            alt="AFOLUKUTV Media"
            style={{ width: "250px" }}
          />
          {currentData.showLogoNews && (
            <div
              style={{
                color: currentData.logoTheme === "black" ? "#000" : "#fff",
                fontSize: "35px",
                fontWeight: "900",
                marginTop: "-5px",
                textTransform: "uppercase",
                letterSpacing: "6px",
              }}
            >
              News
            </div>
          )}
        </div>
      </div>`;

const newLogo = `        {/* Logo AFOLUKU TV */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src="/afoluku-tv-logo.png"
            alt="A FOLUKU TV"
            style={{ height: "120px", objectFit: "contain" }}
          />
          {currentData.showLogoNews && (
            <div
              style={{
                color: "#fff",
                fontSize: "24px",
                fontWeight: "900",
                marginTop: "-5px",
                textTransform: "uppercase",
                letterSpacing: "6px",
              }}
            >
              News
            </div>
          )}
        </div>
      </div>`;

if (!content.includes(oldLogo)) {
  console.error('TARGET NOT FOUND');
  process.exit(1);
}

content = content.replace(oldLogo, newLogo);
fs.writeFileSync('src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js', content);
console.log('Done');
