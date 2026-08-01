"use client";

import { useState, useRef, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import dynamic from "next/dynamic";
const CustomEditor = dynamic(() => import("@/components/CustomEditor"), {
  ssr: false,
});
import { useRouter } from "next/navigation";
import { publishToMeta } from "./social-actions";
import { saveInstagramState, generateTitles, generateCaption } from "./instagram-actions";

export default function InstagramGenerator({ article, recentArticles = [] }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [quillKey, setQuillKey] = useState(0);

  // Layout states
  const [leftWidth, setLeftWidth] = useState(400);
  const [rightWidth, setRightWidth] = useState(300);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(250, Math.min(800, e.clientX)));
      } else if (isDraggingRight) {
        const newWidth = document.body.clientWidth - e.clientX;
        setRightWidth(Math.max(250, Math.min(800, newWidth)));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDraggingLeft, isDraggingRight]);

  const [carouselOrder, setCarouselOrder] = useState("fr-first");
  const [instagramTags, setInstagramTags] = useState("");
  const [publishCaption, setPublishCaption] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);


  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const res = await generateCaption(article);
      if (res.success) {
        setPublishCaption(res.caption);
      } else {
        alert("Erreur de génération: " + res.error);
      }
    } catch (e) {
      alert("Erreur: " + e.message);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handlePublish = async () => {
    if (!publishCaption) {
      alert("Veuillez générer ou rédiger une légende.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Obtenir les deux images
      const base64Fr = await getCanvasImage("fr");
      const base64Bsh = await getCanvasImage("bsh");
      
      if (!base64Fr || !base64Bsh) {
        alert("Erreur de génération des images.");
        setIsPublishing(false);
        return;
      }
      
      const formData = new FormData();
      if (carouselOrder === "fr-first") {
        formData.append("base64Image1", base64Fr);
        formData.append("base64Image2", base64Bsh);
      } else {
        formData.append("base64Image1", base64Bsh);
        formData.append("base64Image2", base64Fr);
      }
      
      formData.append("caption", publishCaption);
      formData.append("instagramTags", instagramTags);
      formData.append("articleId", article.id);
      
      const res = await publishToMeta(formData);
      
      if (res.success) {
        alert("Publication réussie sur Meta !");
      } else {
        alert("Erreur: " + res.error);
      }
    } catch (e) {
      alert("Erreur système: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const getCanvasImage = async (lang) => {
    try {
      const ref = lang === "fr" ? postRefFr : postRefBsh;
      if (!ref.current) return null;
      
      // Petit hack pour forcer le bon rendu
      const node = ref.current;
      return await htmlToImage.toJpeg(node, {
        quality: 1.0,
        pixelRatio: 2,
        width: 1080,
        height: 1350,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const getInitialBody = () => {
    if (article.content) {
      const plainText = article.content.replace(/<[^>]+>/g, "");
      return plainText.substring(0, 250) + "...";
    }
    return "";
  };

  const getInitialDate = () => {
    const today = new Date();
    const options = { day: "numeric", month: "long", year: "numeric" };
    return `Le, ${today.toLocaleDateString("fr-FR", options)}`;
  };

  const colorThemes = {
    red: {
      main: "#dc2626",
      gradStart: "#dc2626",
      gradEnd: "#7f1d1d",
    },
    blue: { main: "#2563eb", gradStart: "#3b82f6", gradEnd: "#1e3a8a" },
    green: { main: "#16a34a", gradStart: "#22c55e", gradEnd: "#14532d" },
    purple: { main: "#9333ea", gradStart: "#a855f7", gradEnd: "#581c87" },
    gold: { main: "#ca8a04", gradStart: "#facc15", gradEnd: "#854d0e" },
    black: { main: "#171717", gradStart: "#404040", gradEnd: "#000000" },
  };

  const initialTemplateState = {
    title_fr: article.title || "",
    body_fr: getInitialBody(),
    category_fr: article.category || "Actualité",

    title_bsh: article.title || "",
    body_bsh: getInitialBody(),
    category_bsh: article.category || "Actualité",

    date: getInitialDate(),
    source: "Culture Media News",
    logoTheme: "white",
    showBreakingNews: false,
    showLogoNews: false,
    themeColor: "red",
  };

  // État indépendant pour CHAQUE template
  const [templateData, setTemplateData] = useState({
    "template-1": { ...initialTemplateState },
    "template-2": { ...initialTemplateState },
    "template-3": { ...initialTemplateState, logoTheme: "black" },
    "template-4": { ...initialTemplateState },
    "template-5": { ...initialTemplateState },
  });

  const [activeLang, setActiveLang] = useState("fr"); // "fr" ou "bsh"
  const [selectedTemplateFr, setSelectedTemplateFr] = useState("template-2"); // default to Editorial Bleu
  const [selectedTemplateBsh, setSelectedTemplateBsh] = useState("template-3"); // default to Editorial Blanc

  // Utilisation du proxy d'image personnalisé pour éviter les problèmes CORS et de configuration Next.js
  const proxiedImageUrl = article.image_url
    ? `/api/proxy-image?url=${encodeURIComponent(article.image_url)}`
    : "";

  const postRefFr = useRef(null);
  const postRefBsh = useRef(null);

  // currentData corresponds au template actif pour la langue active
  const activeTemplate = activeLang === "fr" ? selectedTemplateFr : selectedTemplateBsh;
  const currentData = templateData[activeTemplate];
  const activeColors = colorThemes[currentData.themeColor] || colorThemes.red;

  const updateData = (field, value) => {
    // Fields that represent content should be synchronized across all templates
    const sharedFields = [
      "title_fr", "body_fr", "category_fr",
      "title_bsh", "body_bsh", "category_bsh",
      "date", "source"
    ];

    setTemplateData((prev) => {
      const newState = { ...prev };
      
      if (sharedFields.includes(field)) {
        // Update this field in all templates
        Object.keys(newState).forEach(templateKey => {
          newState[templateKey] = {
            ...newState[templateKey],
            [field]: value
          };
        });
      } else {
        // Update this field only in the active template for the current language
        newState[activeTemplate] = {
          ...newState[activeTemplate],
          [field]: value,
        };
      }
      
      return newState;
    });
  };

  const forceEditorRemount = () => {
    setQuillKey((prev) => prev + 1);
  };

  const cleanHtmlForDisplay = (html) => {
    if (!html) return "";
    return html;
  };

  const generateAIHook = async (lang = activeLang) => {
    setIsGenerating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const promptFr = `Résume cet article en une version très courte (2 à 3 phrases maximum) allant à l'essentiel pour un post Instagram. 
Tu dois absolument mettre en gras (avec la balise HTML <strong>) les points clés ou les mots importants.
De plus, extrais le nom de la source d'origine de l'article (ex: Le Monde, AFP, L'Equipe, etc.). Si aucune source n'est identifiable de manière évidente, utilise "Culture Media News".
Tu DOIS renvoyer UNIQUEMENT un objet JSON valide avec cette structure exacte (sans bloc markdown):
{
  "hook": "Le résumé avec les balises <strong>...",
  "source": "Nom de la source"
}

Titre: ${article.title}
Contenu: ${article.content || ''}`;

      const promptBsh = `Traduis et résume cet article en langue Bushingue (Créole) en une version très courte (2 à 3 phrases maximum) allant à l'essentiel pour un post Instagram.
Tu dois absolument mettre en gras (avec la balise HTML <strong>) les points clés ou les mots importants.
De plus, extrais le nom de la source d'origine de l'article (ex: Le Monde, AFP, L'Equipe, etc.). Si aucune source n'est identifiable de manière évidente, utilise "Culture Media News".
Tu DOIS renvoyer UNIQUEMENT un objet JSON valide avec cette structure exacte (sans bloc markdown):
{
  "hook": "Le résumé avec les balises <strong>...",
  "source": "Nom de la source"
}

Titre: ${article.title}
Contenu: ${article.content || ''}`;
      
      const res = await fetch("/api/ai/suggest-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: lang === "fr" ? promptFr : promptBsh,
        }),
      });
      const data = await res.json();
      
      if (data.hook) {
        let parsed;
        try {
          parsed = JSON.parse(data.hook);
        } catch(e) {
          parsed = { hook: data.hook, source: "Culture Media News" };
        }

        const htmlHook = parsed.hook.startsWith("<") 
          ? parsed.hook 
          : `<p>${parsed.hook.replace(/\n/g, '<br/>')}</p>`;
        
        // On met à jour directement le state global pour que ça s'affiche
        updateData(`body_${lang}`, htmlHook);
        if (parsed.source) {
          updateData("source", parsed.source);
        }
        forceEditorRemount();
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la génération de l'accroche.");
    }
    setIsGenerating(false);
  };

  // Auto-génération au chargement du composant
  useEffect(() => {
    // Si le corps est le texte tronqué par défaut (qui finit par "...")
    if (currentData[`body_${activeLang}`].endsWith("...")) {
      generateAIHook(activeLang);
    }
  }, [activeLang]); // re-run if they switch lang and it's not generated


  const handleDownload = async (lang) => {
    const ref = lang === "fr" ? postRefFr : postRefBsh;
    if (!ref.current) return;
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, {
        quality: 0.95,
        width: 1080,
        height: 1350,
        pixelRatio: 1,
        fontEmbedCSS: "",
      });
      if (!dataUrl) throw new Error("Impossible de générer l'image");
      const fileName = `insta_${article.slug || "post"}_${lang}_${Date.now()}.png`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      setSuccessMsg(`Image ${lang.toUpperCase()} téléchargée avec succès !`);
    } catch (err) {
      setErrorMsg(
        err.message || "Une erreur s'est produite lors du téléchargement.",
      );
    }
    setIsSaving(false);
  };

  const handleDownloadBoth = async () => {
    await handleDownload("fr");
    setTimeout(() => {
      handleDownload("bsh");
    }, 1000);
  };

  // ---------------------------------------------------------------------------
  // TEMPLATE RENDERS
  // ---------------------------------------------------------------------------

  const renderBreakingNewsBanner = () => {
    if (!currentData.showBreakingNews) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "translateY(-5px)",
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        <img
          src="/backgrounds/breaking-news-strip.png?v=5"
          alt="Breaking News"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    );
  };

  const renderTemplate1 = (lang, ref) => (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#0d16c7",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Montserrat", sans-serif',
      }}
    >
      {/* Red Background Circle */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-20%",
          width: "140%",
          height: "60%",
          backgroundColor: activeColors.main,
          borderRadius: "50%",
        }}
      ></div>

      {/* Top Banner BREAKING NEWS */}
      <div
        style={{
          position: "absolute",
          top: "70px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#fff",
          padding: "15px 50px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: activeColors.main,
            fontSize: "60px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          BREAKING NEWS
        </h2>
      </div>

      {/* Image Frame */}
      <div
        style={{
          position: "absolute",
          top: "220px",
          left: "80px",
          right: "80px",
          height: "550px",
          backgroundColor: "#fff",
          borderRadius: "15px",
          padding: "10px",
          boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <img
            src={proxiedImageUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            alt="Background"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "830px",
          left: "80px",
          right: "80px",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          className="insta-title"
          style={{
            color: "#fff",
            fontSize: "48px",
            fontWeight: "bold",
            lineHeight: "1.3",
            margin: 0,
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`title_${lang}`]),
          }}
        />
        <div
          className="insta-body"
          style={{
            color: "#fff",
            fontSize: "30px",
            lineHeight: "1.5",
            fontWeight: "500",
            whiteSpace: "pre-line",
            marginTop: "20px"
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`body_${lang}`]),
          }}
        />
      </div>

      {/* Bottom info strip */}
      <div
        style={{
          position: "absolute",
          top: "1050px",
          left: "80px",
          right: "80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: "24px",
            fontWeight: "900",
            display: "flex",
            flexDirection: "column",
            textTransform: "uppercase",
            maxWidth: "350px",
            wordBreak: "break-word",
            lineHeight: "1.2"
          }}
        >
          <span>{currentData.source}</span>
        </div>
        <div
          style={{
            backgroundColor: "#1e3a8a",
            padding: "15px 40px",
            borderRadius: "5px",
            color: "#fff",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          News Link
        </div>
        <div
          style={{
            color: "#fff",
            fontSize: "24px",
            textAlign: "right",
            fontWeight: "bold",
          }}
        >
          <i className="fas fa-qrcode" style={{ fontSize: "50px" }}></i>
          <br />
          CODE
        </div>
      </div>

      {/* Date Pill */}
      <div
        style={{
          position: "absolute",
          top: "1180px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: activeColors.main,
          color: "#fff",
          padding: "10px 30px",
          fontSize: "20px",
          fontWeight: "bold",
          borderRadius: "4px",
        }}
      >
        {currentData.date}
      </div>

      {/* Footer Area */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100px",
          backgroundColor: "#f1f5f9",
          borderTopLeftRadius: "50px",
          borderTopRightRadius: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#0f172a", fontSize: "20px", fontWeight: "600" }}>
          Culture Media News &bull; Votre source d&apos;actualité culturelle et médiatique
        </span>
      </div>
      {renderBreakingNewsBanner()}
    </div>
  );

  const renderTemplate2 = (lang, ref) => (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundImage: "url(/backgrounds/editorial-blue-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Montserrat", sans-serif',
      }}
    >
      {/* Top Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "600px",
          overflow: "hidden",
        }}
      >
        <img
          src={proxiedImageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt="Background"
          crossOrigin="anonymous"
        />
        {/* Date */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "0",
            backgroundColor: activeColors.main,
            color: "#fff",
            padding: "8px 25px",
            fontSize: "24px",
            fontWeight: "bold",
            borderTopRightRadius: "20px",
            borderBottomRightRadius: "20px",
          }}
        >
          {currentData.date}
        </div>
        {/* Logo */}
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
            alt="CMN Media"
            style={{ width: "180px" }}
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
      </div>

      {/* Red Border Separator */}
      <div
        style={{
          position: "absolute",
          top: "595px",
          left: 0,
          right: 0,
          height: "15px",
          backgroundColor: "#ffffff",
          zIndex: 10,
        }}
      ></div>

      <div
        style={{
          position: "absolute",
          top: currentData.showBreakingNews ? "480px" : "600px",
          left: currentData.showBreakingNews ? "0" : "50%",
          transform: currentData.showBreakingNews ? "translate(0, -50%)" : "translate(-50%, -50%)",
          display: "flex",
          boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
          borderRadius: "4px",
          overflow: "hidden",
          zIndex: 20,
        }}
      >
        <div
          style={{
            background:
              `linear-gradient(to bottom, ${activeColors.gradStart}, ${activeColors.gradEnd})`,
            padding: "3px 25px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "55px",
              fontWeight: "900",
              letterSpacing: "1px",
              fontFamily: '"Arial Black", Arial, sans-serif',
              textTransform: "uppercase",
              lineHeight: "1.1",
              WebkitTextStroke: "2.5px #ffffff",
            }}
          >
            CULTURE
          </span>
        </div>
        <div
          style={{
            background: "linear-gradient(to bottom, #ffffff, #cbd5e1)",
            padding: "3px 25px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#1e3a8a",
              fontSize: "55px",
              fontWeight: "900",
              letterSpacing: "1px",
              fontFamily: "Arial, sans-serif",
              textTransform: "uppercase",
              lineHeight: "1.1",
            }}
          >
            MÉDIA
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: currentData.showBreakingNews ? "480px" : "566px",
          left: currentData.showBreakingNews ? "auto" : "50%",
          right: currentData.showBreakingNews ? "0" : "auto",
          transform: currentData.showBreakingNews ? "translate(0, -50%)" : "translate(-50%, -100%)",
          backgroundColor: "#f1d210",
          color: "#000",
          padding: "6px 20px",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
          fontSize: "20px",
          fontWeight: "900",
          textTransform: "uppercase",
          zIndex: 25,
          boxShadow: "0 -4px 6px rgba(0,0,0,0.2)",
        }}
      >
        {currentData[`category_${lang}`]}
      </div>

      {/* Content Area */}
      <div
        style={{
          position: "absolute",
          top: "660px",
          left: "50px",
          right: "50px",
        }}
      >
        <div
          className="insta-title"
          style={{
            color: "#facc15",
            fontSize: "50px",
            fontWeight: "900",
            lineHeight: "1.2",
            textTransform: "uppercase",
            marginBottom: "25px",
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`title_${lang}`]),
          }}
        />
        <div
          className="insta-body"
          style={{
            color: "#fff",
            fontSize: "30px",
            lineHeight: "1.5",
            fontWeight: "500",
            whiteSpace: "pre-line",
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`body_${lang}`]),
          }}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50px",
          right: "50px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                backgroundColor: "#facc15",
                color: "#000",
                padding: "8px 20px",
                borderRadius: "20px",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            >
              Source
            </span>
            <span style={{ color: "#fff", fontSize: "22px" }}>
              {currentData.source}
            </span>
          </div>
          <div style={{ color: "#94a3b8", fontSize: "18px" }}>
            Plus d&apos;actualité sur : culturemedianews.fr
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              backgroundColor: activeColors.main,
              color: "#fff",
              padding: "8px 20px",
              borderRadius: "20px",
              fontSize: "20px",
              fontWeight: "bold",
              display: "inline-block",
              marginBottom: "10px",
            }}
          >
            Suivez-nous pour plus d'infos
          </div>
          <div style={{ color: "#fff", fontSize: "28px", fontWeight: "bold" }}>
            @culturemediacmn
          </div>
        </div>
      </div>
      {renderBreakingNewsBanner()}
    </div>
  );

  const renderTemplate3 = (lang, ref) => (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#f8fafc",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Montserrat", sans-serif',
      }}
    >
      {/* Background Dots Pattern (simulated with radial gradient) */}
      <div
        style={{
          position: "absolute",
          top: "600px",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(#cbd5e1 2px, transparent 2px)",
          backgroundSize: "20px 20px",
          opacity: 0.5,
        }}
      ></div>

      {/* Top Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "600px",
          overflow: "hidden",
        }}
      >
        <img
          src={proxiedImageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt="Background"
          crossOrigin="anonymous"
        />
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "0",
            backgroundColor: "#1e3a8a",
            color: "#fff",
            padding: "8px 25px",
            fontSize: "24px",
            fontWeight: "bold",
            borderTopRightRadius: "20px",
            borderBottomRightRadius: "20px",
          }}
        >
          {currentData.date}
        </div>
        {/* Logo */}
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
            alt="CMN Media"
            style={{ width: "180px" }}
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
      </div>

      <div
        style={{
          position: "absolute",
          top: "595px",
          left: 0,
          right: 0,
          height: "15px",
          backgroundColor: "#ffffff",
          zIndex: 10,
        }}
      ></div>

      {renderBreakingNewsBanner()}

      <div
        style={{
          position: "absolute",
          top: currentData.showBreakingNews ? "480px" : "600px",
          left: currentData.showBreakingNews ? "0" : "50%",
          transform: currentData.showBreakingNews ? "translate(0, -50%)" : "translate(-50%, -50%)",
          display: "flex",
          boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
          borderRadius: "4px",
          overflow: "hidden",
          zIndex: 20,
        }}
      >
        <div
          style={{
            background:
              `linear-gradient(to bottom, ${activeColors.gradStart}, ${activeColors.gradEnd})`,
            padding: "3px 25px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "55px",
              fontWeight: "900",
              letterSpacing: "1px",
              fontFamily: '"Arial Black", Arial, sans-serif',
              textTransform: "uppercase",
              lineHeight: "1.1",
              WebkitTextStroke: "2.5px #ffffff",
            }}
          >
            CULTURE
          </span>
        </div>
        <div
          style={{
            background: "linear-gradient(to bottom, #ffffff, #cbd5e1)",
            padding: "3px 25px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#1e3a8a",
              fontSize: "55px",
              fontWeight: "900",
              letterSpacing: "1px",
              fontFamily: "Arial, sans-serif",
              textTransform: "uppercase",
              lineHeight: "1.1",
            }}
          >
            MÉDIA
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: currentData.showBreakingNews ? "480px" : "566px",
          left: currentData.showBreakingNews ? "auto" : "50%",
          right: currentData.showBreakingNews ? "0" : "auto",
          transform: currentData.showBreakingNews ? "translate(0, -50%)" : "translate(-50%, -100%)",
          backgroundColor: "#f1d210",
          color: "#000",
          padding: "6px 20px",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
          fontSize: "20px",
          fontWeight: "900",
          textTransform: "uppercase",
          zIndex: 25,
          boxShadow: "0 -4px 6px rgba(0,0,0,0.2)",
        }}
      >
        {currentData[`category_${lang}`]}
      </div>

      <div
        style={{
          position: "absolute",
          top: "660px",
          left: "50px",
          right: "50px",
          zIndex: 2,
        }}
      >
        <div
          className="insta-title"
          style={{
            color: activeColors.main,
            fontSize: "50px",
            fontWeight: "900",
            lineHeight: "1.2",
            textTransform: "uppercase",
            marginBottom: "25px",
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`title_${lang}`]),
          }}
        />
        <div
          className="insta-body"
          style={{
            color: "#1e3a8a",
            fontSize: "30px",
            lineHeight: "1.5",
            fontWeight: "500",
            whiteSpace: "pre-line",
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`body_${lang}`]),
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50px",
          right: "50px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          zIndex: 2,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                backgroundColor: "#facc15",
                color: "#000",
                padding: "8px 20px",
                borderRadius: "20px",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            >
              Source
            </span>
            <span
              style={{ color: "#1e3a8a", fontSize: "22px", fontWeight: "bold" }}
            >
              {currentData.source}
            </span>
          </div>
          <div style={{ color: "#64748b", fontSize: "18px" }}>
            Plus d&apos;actualité sur : culturemedianews.fr
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              backgroundColor: activeColors.main,
              color: "#fff",
              padding: "8px 20px",
              borderRadius: "20px",
              fontSize: "20px",
              fontWeight: "bold",
              display: "inline-block",
              marginBottom: "10px",
            }}
          >
            Follow we fu moo info
          </div>
          <div
            style={{ color: "#1e3a8a", fontSize: "28px", fontWeight: "bold" }}
          >
            @culturemediacmn
          </div>
        </div>
      </div>
      {renderBreakingNewsBanner()}
    </div>
  );

  const renderTemplate4 = (lang, ref) => (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#041445",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Montserrat", sans-serif',
      }}
    >
      {/* Grid BG */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Top Logo */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "60px",
          color: "#fff",
          fontSize: "40px",
          fontWeight: "900",
        }}
      >
        <i className="fas fa-globe-americas"></i> CMN
      </div>
      <div
        style={{
          position: "absolute",
          top: "60px",
          right: "60px",
          backgroundColor: activeColors.main,
          color: "#fff",
          fontSize: "40px",
          fontWeight: "900",
          padding: "10px 30px",
          transform: "skewX(-15deg)",
        }}
      >
        <span style={{ display: "inline-block", transform: "skewX(15deg)" }}>
          ALERTE INFO
        </span>
      </div>

      {/* Glow Center */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          backgroundColor: "transparent",
          borderRadius: "50%",
          boxShadow: "0 0 150px 50px rgba(239, 68, 68, 0.6)",
        }}
      ></div>

      {/* Circular Image (Fake Globe) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "550px",
          height: "550px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "5px solid rgba(255,255,255,0.2)",
        }}
      >
        <img
          src={proxiedImageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt="Globe"
          crossOrigin="anonymous"
        />
      </div>

      {/* Giant Banners Over Globe */}
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -100%) skewX(-10deg)",
          backgroundColor: activeColors.main,
          padding: "10px 60px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            color: "#fff",
            margin: 0,
            fontSize: "110px",
            fontWeight: "900",
            transform: "skewX(10deg)",
          }}
        >
          BREAKING
        </h1>
      </div>
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, 0) skewX(-10deg)",
          backgroundColor: "#1d4ed8",
          padding: "10px 60px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          zIndex: 9,
          marginTop: "10px",
        }}
      >
        <h1
          style={{
            color: "#fff",
            margin: 0,
            fontSize: "110px",
            fontWeight: "900",
            transform: "skewX(10deg)",
          }}
        >
          NEWS
        </h1>
      </div>

      {/* Date Banner */}
      <div
        style={{
          position: "absolute",
          top: "85%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: activeColors.main,
          color: "#fff",
          padding: "15px 40px",
          fontSize: "32px",
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        {currentData.date}
      </div>

      {/* Footer Info Box */}
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          backgroundColor: "#fff",
          padding: "30px",
          textAlign: "center",
          borderLeft: `15px solid ${activeColors.main}`,
          borderRight: `15px solid ${activeColors.main}`,
        }}
      >
        <div
          className="insta-title"
          style={{
            color: "#000",
            margin: "0 0 15px 0",
            fontSize: "28px",
            fontWeight: "900",
            textTransform: "uppercase",
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`title_${lang}`]),
          }}
        />
        <div
          className="insta-body"
          style={{
            color: "#374151",
            fontSize: "30px",
            lineHeight: "1.5",
            fontWeight: "500",
            whiteSpace: "pre-line",
            marginBottom: "40px"
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`body_${lang}`]),
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "30px",
            color: "#374151",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          <span>
            <i className="fas fa-globe"></i> culturemedianews.fr
          </span>
          <span>
            <i className="fab fa-instagram"></i> @culturemediacmn
          </span>
        </div>
      </div>
      {renderBreakingNewsBanner()}
    </div>
  );

  const renderTemplate5 = (lang, ref) => (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundColor: "#020617",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Montserrat", sans-serif',
      }}
    >
      {/* Background Image (faded) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "80%",
          overflow: "hidden",
        }}
      >
        <img
          src={proxiedImageUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt="Background"
          crossOrigin="anonymous"
        />
      </div>
      {/* Gradient to hide bottom of image */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: 0,
          right: 0,
          height: "50%",
          background:
            "linear-gradient(to bottom, rgba(2,6,23,0) 0%, rgba(2,6,23,1) 100%)",
        }}
      ></div>

      {/* Top Left Logo Area */}
      <div
        style={{
          position: "absolute",
          top: "50px",
          left: "50px",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <div style={{ color: activeColors.main, fontSize: "50px" }}>
          <i className="fas fa-globe"></i>
        </div>
        <div>
          <div
            style={{
              color: "#fff",
              fontSize: "36px",
              fontWeight: "900",
              lineHeight: "1",
            }}
          >
            CMN
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: "18px",
              fontWeight: "bold",
              letterSpacing: "2px",
            }}
          >
            NEWS NETWORK
          </div>
        </div>
      </div>

      {/* Top Right LIVE */}
      <div
        style={{
          position: "absolute",
          top: "50px",
          right: "50px",
          backgroundColor: "#fff",
          color: activeColors.main,
          padding: "10px 20px",
          fontSize: "28px",
          fontWeight: "900",
          borderRadius: "5px",
        }}
      >
        <i
          className="fas fa-circle"
          style={{
            fontSize: "16px",
            verticalAlign: "middle",
            marginRight: "8px",
          }}
        ></i>{" "}
        BREAKING NEWS
      </div>

      {/* Lower Third Graphic */}
      <div
        style={{
          position: "absolute",
          bottom: "350px",
          left: "50px",
          right: "50px",
          display: "flex",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Left Red Block */}
        <div
          style={{
            backgroundColor: activeColors.main,
            color: "#fff",
            padding: "25px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "120px",
          }}
        >
          <i
            className="fas fa-globe-americas"
            style={{ fontSize: "40px", marginBottom: "10px" }}
          ></i>
          <span style={{ fontSize: "24px", fontWeight: "900" }}>LIVE</span>
        </div>
        {/* Center White Block */}
        <div
          style={{
            backgroundColor: "#fff",
            flex: 1,
            padding: "25px 30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: activeColors.main,
              fontSize: "22px",
              fontWeight: "900",
              letterSpacing: "1px",
              marginBottom: "5px",
            }}
          >
            BREAKING NEWS
          </div>
          <div
            style={{
              color: "#000",
              fontSize: "34px",
              fontWeight: "900",
              textTransform: "uppercase",
            }}
          >
            {currentData.source}
          </div>
          <div
            style={{ color: "#64748b", fontSize: "20px", marginTop: "10px" }}
          >
            Reporting in: Paris, France - En direct
          </div>
        </div>
        {/* Right Time Block */}
        <div
          style={{
            backgroundColor: "#1e293b",
            color: "#fff",
            padding: "25px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "150px",
          }}
        >
          <span
            style={{
              color: "#94a3b8",
              fontSize: "18px",
              textTransform: "uppercase",
              marginBottom: "5px",
            }}
          >
            LIVE NEWS
          </span>
          <span style={{ fontSize: "36px", fontWeight: "300" }}>12:00</span>
        </div>
      </div>

      {/* Huge Title Text Below */}
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "50px",
          right: "50px",
          textAlign: "center",
        }}
      >
        <div
          className="insta-title"
          style={{
            color: "#fff",
            fontSize: "85px",
            fontWeight: "900",
            lineHeight: "1.1",
            textTransform: "uppercase",
            textShadow: "0 10px 20px rgba(0,0,0,0.5)",
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`title_${lang}`]),
          }}
        />
        <div
          className="insta-body"
          style={{
            color: "#cbd5e1",
            fontSize: "30px",
            lineHeight: "1.5",
            fontWeight: "500",
            whiteSpace: "pre-line",
            marginTop: "20px"
          }}
          dangerouslySetInnerHTML={{
            __html: cleanHtmlForDisplay(currentData[`body_${lang}`]),
          }}
        />
      </div>
      {renderBreakingNewsBanner()}
    </div>
  );

  return (
    <>
      <style>{`
        /* Styles pour Instagram Post (wrap, points clés en jaune et très gras) */
        .insta-body {
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap !important;
        }
        .insta-body strong {
          color: #facc15 !important;
          font-weight: 900 !important;
        }
        .insta-title {
          word-break: break-word;
          overflow-wrap: break-word;
        }

        /* Masquer la sidebar, le header et les autres éléments du layout admin */
        .admin-sidebar { display: none !important; }
        .admin-header { display: none !important; }
        .header { display: none !important; }
        .footer { display: none !important; }
        
        /* Retirer le padding et forcer la vue pleine page pour la zone principale */
        .admin-main {
          padding: 0 !important;
          margin: 0 !important;
          max-width: 100vw !important;
          height: 100vh !important;
        }
        
        .admin-content {
          padding: 0 !important;
          margin: 0 !important;
          max-width: 100vw !important;
          height: 100vh !important;
        }
        
        .admin-wrapper {
          min-height: 100vh;
          overflow: hidden;
        }
      `}</style>
      <div style={pageContainerStyle}>
        <div style={pageContentStyle}>
          <div style={pageHeaderStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <button
                onClick={() => router.push(`/admin/articles`)}
                className="admin-btn"
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <i className="fas fa-arrow-left"></i> Retour
              </button>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center" }}>
                <i
                  className="fab fa-instagram"
                  style={{ color: "#E1306C", marginRight: "8px" }}
                ></i>{" "}
                Générateur de Post Instagram
              </h2>
            </div>
          </div>
        <div style={pageBodyStyle}>
          {/* Colonne de gauche : Contrôles */}
          <div style={{ ...controlsStyle, width: `${leftWidth}px`, flexShrink: 0 }}>
            {/* TABS FRANÇAIS / BOUSHINGUÉ */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button
                onClick={() => setActiveLang("fr")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: activeLang === "fr" ? "2px solid #2563eb" : "1px solid #d1d5db",
                  backgroundColor: activeLang === "fr" ? "#eff6ff" : "#fff",
                  color: activeLang === "fr" ? "#1d4ed8" : "#374151",
                  fontWeight: activeLang === "fr" ? "bold" : "normal",
                  cursor: "pointer",
                }}
              >
                🇫🇷 Français
              </button>
              <button
                onClick={() => setActiveLang("bsh")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: activeLang === "bsh" ? "2px solid #16a34a" : "1px solid #d1d5db",
                  backgroundColor: activeLang === "bsh" ? "#f0fdf4" : "#fff",
                  color: activeLang === "bsh" ? "#15803d" : "#374151",
                  fontWeight: activeLang === "bsh" ? "bold" : "normal",
                  cursor: "pointer",
                }}
              >
                🇬🇫 Boushingué
              </button>
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                1. Choisissez un Modèle
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {[
                  { id: "template-1", label: "Cadre Abstrait (Rouge/Bleu)" },
                  { id: "template-2", label: "Éditorial (Fond Bleu)" },
                  { id: "template-3", label: "Éditorial (Fond Blanc)" },
                  { id: "template-4", label: "Globe Breaking News" },
                  { id: "template-5", label: "Alerte Live (TV)" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      if (activeLang === "fr") setSelectedTemplateFr(tpl.id);
                      else setSelectedTemplateBsh(tpl.id);
                    }}
                    style={templateBtnStyle(activeTemplate === tpl.id)}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: "#fee2e2",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ef4444",
                  color: "#b91c1c",
                }}
              >
                <input
                  type="checkbox"
                  checked={currentData.showBreakingNews}
                  onChange={(e) =>
                    updateData("showBreakingNews", e.target.checked)
                  }
                  style={{ marginRight: "10px", transform: "scale(1.2)" }}
                />
                <i
                  className="fas fa-exclamation-triangle"
                  style={{ marginRight: "8px" }}
                ></i>
                Afficher la bande "BREAKING NEWS"
              </label>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: "#f1f5f9",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  color: "#0f172a",
                }}
              >
                <input
                  type="checkbox"
                  checked={currentData.showLogoNews}
                  onChange={(e) => updateData("showLogoNews", e.target.checked)}
                  style={{ marginRight: "10px", transform: "scale(1.2)" }}
                />
                Afficher "News" sous le logo (coin droit)
              </label>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                2. Titre (Gros texte) ({activeLang === "fr" ? "FR" : "BSH"}) :
              </label>
              <div style={{ backgroundColor: "#fff", border: "1px solid #d1d5db", borderRadius: "6px" }}>
                <CustomEditor
                  value={currentData[`title_${activeLang}`]}
                  onChange={(val) => updateData(`title_${activeLang}`, val)}
                />
              </div>
            </div>

            {/* AI / Editor */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                Texte de l&apos;article ({activeLang === "fr" ? "FR" : "BSH"}) :
              </label>
              <button
                onClick={generateAIHook}
                disabled={isGenerating}
                style={{
                  background: "none",
                  border: "1px solid #d8b4fe",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  backgroundColor: "#f3e8ff",
                  color: "#7e22ce",
                  padding: "4px 8px",
                  fontSize: "12px"
                }}
              >
                {isGenerating ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-magic"></i>
                )}{" "}
                {activeLang === "fr" ? "Générer le résumé" : "Traduire & Résumer"}
              </button>
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                color: "#000",
                marginBottom: "10px",
              }}
            >
              <CustomEditor
                key={`body-${activeTemplate}-${activeLang}-${quillKey}`}
                value={currentData[`body_${activeLang}`]}
                onChange={(val) => updateData(`body_${activeLang}`, val)}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                Couleur du thème :
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {Object.keys(colorThemes).map((colorKey) => (
                  <button
                    key={colorKey}
                    onClick={() => updateData("themeColor", colorKey)}
                    style={{
                      ...templateBtnStyle(currentData.themeColor === colorKey),
                      backgroundColor:
                        currentData.themeColor === colorKey
                          ? colorThemes[colorKey].main
                          : "transparent",
                      color:
                        currentData.themeColor === colorKey
                          ? "#fff"
                          : colorThemes[colorKey].main,
                      borderColor: colorThemes[colorKey].main,
                    }}
                  >
                    {colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                  </button>
                ))}
              </div>
            </div>


            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                Catégorie / Pillule ({activeLang === "fr" ? "FR" : "BSH"}) :
              </label>
              <input
                type="text"
                value={currentData[`category_${activeLang}`]}
                onChange={(e) => updateData(`category_${activeLang}`, e.target.value)}
                className="admin-form-control"
              />
            </div>
                <div style={{ marginBottom: "15px" }}>
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
                </div>

            {(activeTemplate === "template-2" ||
              activeTemplate === "template-3" ||
              activeTemplate === "template-4" ||
              activeTemplate === "template-1") && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  Date affichée :
                </label>
                <input
                  type="text"
                  value={currentData.date}
                  onChange={(e) => updateData("date", e.target.value)}
                  className="admin-form-control"
                />
              </div>
            )}

            {(activeTemplate === "template-2" ||
              activeTemplate === "template-3") && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  Couleur du Logo de coin :
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => updateData("logoTheme", "white")}
                    style={templateBtnStyle(currentData.logoTheme === "white")}
                  >
                    Texte Blanc
                  </button>
                  <button
                    onClick={() => updateData("logoTheme", "black")}
                    style={templateBtnStyle(currentData.logoTheme === "black")}
                  >
                    Texte Noir
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  color: activeColors.main,
                  marginBottom: "15px",
                  fontSize: "14px",
                  backgroundColor: "#fee2e2",
                  padding: "10px",
                  borderRadius: "4px",
                }}
              >
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div
                style={{
                  color: "#10b981",
                  marginBottom: "15px",
                  fontSize: "14px",
                  backgroundColor: "#d1fae5",
                  padding: "10px",
                  borderRadius: "4px",
                }}
              >
                {successMsg}
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => handleDownload("fr")}
                disabled={isSaving}
                className="admin-btn admin-btn-primary"
                style={{ width: "100%", padding: "10px" }}
              >
                {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                {" "}Télécharger FR (PNG)
              </button>
              
              <button
                onClick={() => handleDownload("bsh")}
                disabled={isSaving}
                className="admin-btn"
                style={{ width: "100%", padding: "10px", backgroundColor: "#16a34a", color: "white", border: "none" }}
              >
                {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                {" "}Télécharger BSH (PNG)
              </button>
              
              <button
                onClick={handleDownloadBoth}
                disabled={isSaving}
                className="admin-btn"
                style={{ width: "100%", padding: "10px", backgroundColor: "#4f46e5", color: "white", border: "none" }}
              >
                <i className="fas fa-download"></i>
                {" "}Télécharger LES DEUX
              </button>
            </div>
          </div>

          {/* Resizer Gauche */}
          <div 
            onMouseDown={() => setIsDraggingLeft(true)}
            style={{ 
              width: "6px", 
              cursor: "col-resize", 
              backgroundColor: isDraggingLeft ? "#3b82f6" : "#e5e7eb",
              transition: "background-color 0.2s",
              flexShrink: 0
            }} 
          />
          {/* Colonne de droite : Prévisualisation côte à côte */}
          <div style={previewContainerStyle}>
            <div style={{ display: "flex", gap: "15px", height: "100%", overflowY: "auto", justifyContent: "center", alignItems: "flex-start", padding: "15px" }}>
              {/* Preview FR */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ padding: "6px 16px", backgroundColor: activeLang === "fr" ? "#2563eb" : "#9ca3af", color: "#fff", borderRadius: "6px 6px 0 0", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }} onClick={() => setActiveLang("fr")}>🇫🇷 Français</div>
                <div style={{ width: "454px", height: "567px", overflow: "hidden", position: "relative" }}>
                  <div style={{ transform: "scale(0.42)", transformOrigin: "top left", width: "1080px", height: "1350px", position: "absolute", top: 0, left: 0, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                    {selectedTemplateFr === "template-1" && renderTemplate1("fr", postRefFr)}
                    {selectedTemplateFr === "template-2" && renderTemplate2("fr", postRefFr)}
                    {selectedTemplateFr === "template-3" && renderTemplate3("fr", postRefFr)}
                    {selectedTemplateFr === "template-4" && renderTemplate4("fr", postRefFr)}
                    {selectedTemplateFr === "template-5" && renderTemplate5("fr", postRefFr)}
                  </div>
                </div>
              </div>
              {/* Preview BSH */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ padding: "6px 16px", backgroundColor: activeLang === "bsh" ? "#16a34a" : "#9ca3af", color: "#fff", borderRadius: "6px 6px 0 0", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }} onClick={() => setActiveLang("bsh")}>🌴 Boushingué</div>
                <div style={{ width: "454px", height: "567px", overflow: "hidden", position: "relative" }}>
                  <div style={{ transform: "scale(0.42)", transformOrigin: "top left", width: "1080px", height: "1350px", position: "absolute", top: 0, left: 0, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                    {selectedTemplateBsh === "template-1" && renderTemplate1("bsh", postRefBsh)}
                    {selectedTemplateBsh === "template-2" && renderTemplate2("bsh", postRefBsh)}
                    {selectedTemplateBsh === "template-3" && renderTemplate3("bsh", postRefBsh)}
                    {selectedTemplateBsh === "template-4" && renderTemplate4("bsh", postRefBsh)}
                    {selectedTemplateBsh === "template-5" && renderTemplate5("bsh", postRefBsh)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Resizer Droit */}
          <div 
            onMouseDown={() => setIsDraggingRight(true)}
            style={{ 
              width: "6px", 
              cursor: "col-resize", 
              backgroundColor: isDraggingRight ? "#3b82f6" : "#e5e7eb",
              transition: "background-color 0.2s",
              flexShrink: 0
            }} 
          />
          {/* Colonne de droite : Publish Meta et Autres articles */}
          <div style={{ width: `${rightWidth}px`, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: "1px solid #e5e7eb", backgroundColor: "#fff", overflowY: "auto" }}>
            
            {/* PUBLISH META BLOCK */}
            <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: "600", fontSize: "14px", color: "#374151", marginBottom: "15px" }}>Publier sur Instagram</div>
              
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "5px", color: "#4b5563" }}>
                  Ordre du Carrousel :
                </label>
                <select 
                  value={carouselOrder} 
                  onChange={(e) => setCarouselOrder(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                >
                  <option value="fr-first">FR en premier, puis BSH</option>
                  <option value="bsh-first">BSH en premier, puis FR</option>
                </select>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "5px", color: "#4b5563" }}>
                  Taguer (Instagram) :
                </label>
                <input
                  type="text"
                  value={instagramTags}
                  onChange={(e) => setInstagramTags(e.target.value)}
                  placeholder="@culturemediacmn"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#4b5563" }}>
                  Légende :
                </label>
                <button
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                  style={{
                    background: "none",
                    border: "1px solid #d8b4fe",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "#f3e8ff",
                    color: "#7e22ce",
                    padding: "4px 8px",
                    fontSize: "11px"
                  }}
                >
                  {isGeneratingCaption ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-magic"></i>
                  )}{" "}
                  IA
                </button>
              </div>

              <textarea
                value={publishCaption}
                onChange={(e) => setPublishCaption(e.target.value)}
                placeholder="Légende du post..."
                rows={8}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  resize: "vertical",
                  marginBottom: "15px"
                }}
              />
              
              <button
                onClick={handlePublish}
                disabled={isPublishing || isSaving}
                className="admin-btn"
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  color: "white", 
                  border: "none",
                  fontWeight: "bold",
                  cursor: (isPublishing || isSaving) ? "not-allowed" : "pointer",
                  opacity: (isPublishing || isSaving) ? 0.7 : 1
                }}
              >
                {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-instagram"></i>}
                {" "}Publier
              </button>
            </div>

            {/* AUTRES ARTICLES BLOCK */}
            <div style={{ flex: 1 }}>
              <div style={{ padding: "15px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb", position: "sticky", top: 0, zIndex: 10 }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#111827" }}>
                  <i className="fas fa-list-ul" style={{ marginRight: "8px" }}></i>
                  Autres articles
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recentArticles.map((art) => (
                  <a
                    key={art.id}
                    href={"/admin/articles/" + art.id + "/instagram"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 15px",
                      borderBottom: "1px solid #f3f4f6",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ width: "40px", height: "40px", flexShrink: 0, borderRadius: "4px", overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                      {art.image_url ? (
                        <img src={art.image_url} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "500", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {art.title}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    </>

  );
}

// ----------------------------------------------------------------------
// Styles
// ----------------------------------------------------------------------
const templateBtnStyle = (isActive) => ({
  padding: "10px",
  borderRadius: "6px",
  border: isActive ? "2px solid #2563eb" : "1px solid #d1d5db",
  backgroundColor: isActive ? "#eff6ff" : "#fff",
  color: isActive ? "#1d4ed8" : "#374151",
  fontWeight: isActive ? "bold" : "normal",
  cursor: "pointer",
  fontSize: "13px",
  textAlign: "left",
});

const pageContainerStyle = {
  display: "flex",
  justifyContent: "center",
  width: "100vw",
  height: "100vh",
  backgroundColor: "#f3f4f6",
  margin: 0,
  padding: 0,
};

const pageContentStyle = {
  backgroundColor: "#fff",
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const pageHeaderStyle = {
  padding: "10px 20px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#fff",
};

const pageBodyStyle = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const controlsStyle = {
  padding: "20px",
  borderRight: "1px solid #e5e7eb",
  overflowY: "auto",
  backgroundColor: "#fafafa",
  display: "flex",
  flexDirection: "column",
};

const previewContainerStyle = {
  flex: 1,
  backgroundColor: "#e5e7eb",
  display: "flex",
  justifyContent: "center",
  overflow: "auto",
};

const previewWrapperStyle = {
  width: "1080px",
  height: "1350px",
  transform: "scale(0.32)",
  transformOrigin: "top center",
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  marginBottom: "-900px",
};
