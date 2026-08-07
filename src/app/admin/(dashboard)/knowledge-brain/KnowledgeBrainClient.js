"use client";

import { useState } from "react";
import { addKnowledgeRule, deleteKnowledgeRule, updateKnowledgeRule, addDictionaryTerm, deleteDictionaryTerm, updateDictionaryTerm } from "./actions";

export default function KnowledgeBrainClient({ initialRules, initialDictionary }) {
  const [activeTab, setActiveTab] = useState("rules");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTermId, setEditingTermId] = useState(null);
  const [editingRuleId, setEditingRuleId] = useState(null);

  // Tabs style
  const tabStyle = (isActive) => ({
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: isActive ? "3px solid #10b981" : "3px solid transparent",
    fontWeight: isActive ? "bold" : "normal",
    color: isActive ? "#10b981" : "#4b5563",
    backgroundColor: "transparent",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    fontSize: "16px",
  });

  const handleAddRule = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    try {
      await addKnowledgeRule(formData);
      e.target.reset();
    } catch (err) {
      alert("Erreur lors de l'ajout: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Supprimer cette règle ?")) return;
    try {
      await deleteKnowledgeRule(id);
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  };

  const handleEditRuleSubmit = async (e, id) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    try {
      await updateKnowledgeRule(id, formData);
      setEditingRuleId(null);
    } catch (err) {
      alert("Erreur lors de la modification: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleAddTerm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    try {
      await addDictionaryTerm(formData);
      e.target.reset();
    } catch (err) {
      alert("Erreur lors de l'ajout: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteTerm = async (id) => {
    if (!window.confirm("Supprimer ce terme ?")) return;
    try {
      await deleteDictionaryTerm(id);
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  };

  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    try {
      await updateDictionaryTerm(id, formData);
      setEditingTermId(null);
    } catch (err) {
      alert("Erreur lors de la modification: " + err.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#111827" }}>
            <i className="fas fa-brain" style={{ color: "#10b981", marginRight: "10px" }}></i>
            Knowledge Brain
          </h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>
            Mémoire centrale de CMN OS. Définissez la ligne éditoriale, le ton et le vocabulaire multilingue pour l'IA.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
        <button style={tabStyle(activeTab === "rules")} onClick={() => setActiveTab("rules")}>
          <i className="fas fa-gavel" style={{ marginRight: "8px" }}></i> Règles Éditoriales
        </button>
        <button style={tabStyle(activeTab === "dict")} onClick={() => setActiveTab("dict")}>
          <i className="fas fa-language" style={{ marginRight: "8px" }}></i> Dictionnaire Linguistique
        </button>
      </div>

      {activeTab === "rules" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
          {/* Formulaire ajout règle */}
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", height: "fit-content" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Ajouter une Règle</h3>
            <form onSubmit={handleAddRule}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Catégorie</label>
                <select name="category" required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                  <option value="editorial_line">Ligne éditoriale globale</option>
                  <option value="forbidden_rules">Interdictions strictes</option>
                  <option value="tone">Ton et style (ex: pour réseaux sociaux)</option>
                  <option value="formatting_rules">Règles de formatage</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Titre de la règle</label>
                <input type="text" name="title" required placeholder="Ex: Interdiction du créole haïtien" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contenu de la consigne (pour l'IA)</label>
                <textarea name="content" required rows={5} placeholder="L'IA doit strictement..." style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}></textarea>
              </div>
              <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "10px", backgroundColor: "#10b981", color: "white", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
                {isSubmitting ? "Enregistrement..." : "Ajouter la règle"}
              </button>
            </form>
          </div>

          {/* Liste des règles */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Règles Actives</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {initialRules.map(rule => (
                <div key={rule.id} style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  {editingRuleId === rule.id ? (
                    <form onSubmit={(e) => handleEditRuleSubmit(e, rule.id)}>
                      <select name="category" defaultValue={rule.category} required style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}>
                        <option value="editorial_line">Ligne éditoriale globale</option>
                        <option value="forbidden_rules">Interdictions strictes</option>
                        <option value="tone">Ton et style (ex: pour réseaux sociaux)</option>
                        <option value="formatting_rules">Règles de formatage</option>
                      </select>
                      <input type="text" name="title" defaultValue={rule.title} required style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                      <textarea name="content" defaultValue={rule.content} required rows={4} style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}></textarea>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "8px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Sauvegarder</button>
                        <button type="button" onClick={() => setEditingRuleId(null)} style={{ flex: 1, padding: "8px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Annuler</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "12px", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", color: "#4b5563", fontWeight: "bold", textTransform: "uppercase" }}>{rule.category}</span>
                        <h4 style={{ margin: "10px 0 5px 0", fontSize: "16px" }}>{rule.title}</h4>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", whiteSpace: "pre-wrap" }}>{rule.content}</p>
                      </div>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={() => setEditingRuleId(rule.id)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: "5px" }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDeleteRule(rule.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "5px" }}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {initialRules.length === 0 && (
                <div style={{ padding: "30px", textAlign: "center", color: "#9ca3af", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px dashed #d1d5db" }}>
                  Aucune règle définie dans la mémoire centrale.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "dict" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
          {/* Formulaire ajout terme */}
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", height: "fit-content" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Ajouter un Terme</h3>
            <form onSubmit={handleAddTerm}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Langue cible</label>
                <select name="language" required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                  <option value="bsh">Bushinengué (Tongo)</option>
                  <option value="nl">Néerlandais (Suriname)</option>
                </select>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Mot/Concept d'origine (Français)</label>
                <input type="text" name="source_term" required placeholder="Ex: Bonjour, Article, Police..." style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Traduction exacte</label>
                <input type="text" name="translated_term" required placeholder="Ex: I weki, Nyunsu..." style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Contexte (Optionnel)</label>
                <input type="text" name="context" placeholder="Précision sur l'usage..." style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
              </div>
              <button type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "10px", backgroundColor: "#10b981", color: "white", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
                {isSubmitting ? "Ajout..." : "Ajouter au dictionnaire"}
              </button>
            </form>
          </div>

          {/* Liste des termes */}
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Dictionnaire Local</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              {initialDictionary.map(term => (
                <div key={term.id} style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  {editingTermId === term.id ? (
                    <form onSubmit={(e) => handleEditSubmit(e, term.id)}>
                      <select name="language" defaultValue={term.language} required style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}>
                        <option value="bsh">Bushinengué (Tongo)</option>
                        <option value="nl">Néerlandais (Suriname)</option>
                      </select>
                      <input type="text" name="source_term" defaultValue={term.source_term} required style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                      <input type="text" name="translated_term" defaultValue={term.translated_term} required style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                      <input type="text" name="context" defaultValue={term.context} style={{ width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }} />
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "8px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Sauvegarder</button>
                        <button type="button" onClick={() => setEditingTermId(null)} style={{ flex: 1, padding: "8px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Annuler</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "12px", backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", textTransform: "uppercase" }}>{term.language}</span>
                          <span style={{ fontSize: "14px", color: "#6b7280" }}>{term.source_term}</span>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "bold", marginTop: "5px" }}>
                          <i className="fas fa-arrow-right" style={{ fontSize: "12px", color: "#9ca3af", marginRight: "8px" }}></i>
                          {term.translated_term}
                        </div>
                        {term.context && <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "5px", fontStyle: "italic" }}>{term.context}</div>}
                      </div>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={() => setEditingTermId(term.id)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: "5px" }}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDeleteTerm(term.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "5px" }}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {initialDictionary.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "30px", textAlign: "center", color: "#9ca3af", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px dashed #d1d5db" }}>
                  Le dictionnaire local est vide.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
