"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMetaInsights } from "./actions";

export default function InsightsPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getMetaInsights(articleId);
        if (result.success) {
          setData(result);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Erreur de connexion avec le serveur.");
      }
      setLoading(false);
    }
    fetchData();
  }, [articleId]);

  return (
    <div style={pageContainerStyle}>
      <div style={headerStyle}>
        <button onClick={() => router.push('/admin/articles')} className="admin-btn" style={{ marginRight: '15px' }}>
          <i className="fas fa-arrow-left"></i> Retour aux articles
        </button>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>
          Statistiques Meta de l'Article
        </h1>
      </div>

      <div style={contentStyle}>
        {loading && (
          <div style={{ textAlign: "center", padding: "50px", color: "#6b7280" }}>
            <i className="fas fa-spinner fa-spin fa-2x"></i>
            <p style={{ marginTop: "15px" }}>Chargement des statistiques depuis Meta...</p>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "15px", borderRadius: "8px", border: "1px solid #f87171" }}>
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}

        {!loading && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* Facebook Insights */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle("#1877f2")}>
                <i className="fab fa-facebook fa-lg"></i> Facebook
              </div>
              <div style={cardBodyStyle}>
                {data.fbError ? (
                  <p style={{ color: "#b91c1c" }}>{data.fbError}</p>
                ) : data.fbInsights ? (
                  <div style={gridStyle}>
                    <StatBox label="Likes" value={data.fbInsights.likes} icon="fa-thumbs-up" color="#1877f2" />
                    <StatBox label="Commentaires" value={data.fbInsights.comments} icon="fa-comment" color="#1877f2" />
                    <StatBox label="Impressions (Vues)" value={data.fbInsights.impressions} icon="fa-eye" color="#10b981" />
                    <StatBox label="Engagement" value={data.fbInsights.engagedUsers} icon="fa-chart-line" color="#f59e0b" />
                  </div>
                ) : (
                  <p style={{ color: "#6b7280" }}>Aucune donnée Facebook trouvée (l'article n'a pas été publié ou l'ID est introuvable).</p>
                )}
              </div>
            </div>

            {/* Instagram Insights */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle("#e1306c")}>
                <i className="fab fa-instagram fa-lg"></i> Instagram
              </div>
              <div style={cardBodyStyle}>
                {data.igError ? (
                  <p style={{ color: "#b91c1c" }}>{data.igError}</p>
                ) : data.igInsights ? (
                  <div style={gridStyle}>
                    <StatBox label="Likes" value={data.igInsights.likes} icon="fa-heart" color="#e1306c" />
                    <StatBox label="Commentaires" value={data.igInsights.comments} icon="fa-comment" color="#e1306c" />
                    <StatBox label="Impressions (Vues)" value={data.igInsights.impressions} icon="fa-eye" color="#10b981" />
                    <StatBox label="Couverture (Reach)" value={data.igInsights.reach} icon="fa-users" color="#8b5cf6" />
                    <StatBox label="Sauvegardes" value={data.igInsights.saved} icon="fa-bookmark" color="#f59e0b" />
                  </div>
                ) : (
                  <p style={{ color: "#6b7280" }}>Aucune donnée Instagram trouvée (l'article n'a pas été publié ou l'ID est introuvable).</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Components & Styles
// ----------------------------------------------------------------------

function StatBox({ label, value, icon, color }) {
  return (
    <div style={{
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "15px"
    }}>
      <div style={{
        backgroundColor: `${color}20`,
        color: color,
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px"
      }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </div>
        <div style={{ color: "#111827", fontSize: "24px", fontWeight: "bold", marginTop: "4px" }}>
          {value !== undefined ? value.toLocaleString("fr-FR") : "-"}
        </div>
      </div>
    </div>
  );
}

const pageContainerStyle = {
  backgroundColor: "#f3f4f6",
  minHeight: "100vh",
  paddingBottom: "50px"
};

const headerStyle = {
  backgroundColor: "#fff",
  padding: "20px 40px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
};

const contentStyle = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "40px 20px"
};

const cardStyle = {
  backgroundColor: "#fff",
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  border: "1px solid #e5e7eb"
};

const cardHeaderStyle = (color) => ({
  backgroundColor: color,
  color: "#fff",
  padding: "15px 20px",
  fontWeight: "bold",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  gap: "10px"
});

const cardBodyStyle = {
  padding: "30px"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px"
};
