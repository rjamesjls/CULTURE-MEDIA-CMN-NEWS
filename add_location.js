const fs = require('fs');
const file = 'src/app/admin/(dashboard)/articles/[id]/social/SocialGenerator.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add to initialTemplateState
content = content.replace(
  `source: "A FOLUKU TV",`,
  `source: "A FOLUKU TV",\n    location: "CAYENNE",`
);

// 2. Add to sharedFields
content = content.replace(
  `"date", "source"`,
  `"date", "source", "location"`
);

// 3. Update Templates (Template 2 and 3 have "📍 CAYENNE")
content = content.replace(
  /className="fas fa-map-marker-alt" style=\{\{ marginRight: "15px" \}\}>\s*<\/i>\s*CAYENNE/g,
  `className="fas fa-map-marker-alt" style={{ marginRight: "15px" }}></i> {currentData.location || "CAYENNE"}`
);
content = content.replace(
  /<span style=\{\{ marginRight: "10px", fontSize: "32px" \}\}>\s*📍\s*<\/span>\s*CAYENNE/g,
  `<span style={{ marginRight: "10px", fontSize: "32px" }}>📍</span> {currentData.location || "CAYENNE"}`
);

// 4. Add Input Field right after Source
const sourceBlock = `                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    Source :
                  </label>
                  <input
                    type="text"
                    value={currentData.source}
                    onChange={(e) => updateData("source", e.target.value)}
                    className="admin-form-control"
                  />
                </div>`;

const locationBlock = `
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    Lieu :
                  </label>
                  <input
                    type="text"
                    value={currentData.location}
                    onChange={(e) => updateData("location", e.target.value)}
                    className="admin-form-control"
                  />
                </div>`;

content = content.replace(sourceBlock, sourceBlock + locationBlock);

fs.writeFileSync(file, content);
