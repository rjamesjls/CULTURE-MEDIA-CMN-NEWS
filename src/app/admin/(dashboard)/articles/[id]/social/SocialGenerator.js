"use client";

import { useState, useRef, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import dynamic from "next/dynamic";
const CustomEditor = dynamic(() => import("@/components/CustomEditor"), {
  ssr: false,
});
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { publishToMeta, sendPostToReadersAction, unsendPostFromReadersAction } from "./social-actions";
import { saveInstagramState, generateTitles, generateCaption } from "./instagram-actions";

export default function SocialGenerator({ article, recentArticles = [] }) {
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

  const [carouselOrder, setCarouselOrder] = useState(article.instagram_state?.carouselOrder || "fr-first");
  const [instagramTags, setInstagramTags] = useState(article.instagram_state?.instagramTags || "");
  const [publishCaption, setPublishCaption] = useState(article.instagram_state?.publishCaption || "");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSendingToReaders, setIsSendingToReaders] = useState(false);
  const [sentToReadersInfo, setSentToReadersInfo] = useState({
    sent: Boolean(article.instagram_state?.sent_to_readers),
    sentAt: article.instagram_state?.sent_to_readers_at || null,
  });


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

  const getCombinedVideoBlob = async () => {
    try {
      // 1. Snapshot des 2 divs
      const dataUrlFr = await htmlToImage.toJpeg(postRefFr.current, {
        quality: 1.0, pixelRatio: 2, width: 1080, height: 1350,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      const dataUrlBsh = await htmlToImage.toJpeg(postRefBsh.current, {
        quality: 1.0, pixelRatio: 2, width: 1080, height: 1350,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const imgFr = new Image();
      imgFr.src = dataUrlFr;
      await new Promise(r => { imgFr.onload = r; });
      
      const imgBsh = new Image();
      imgBsh.src = dataUrlBsh;
      await new Promise(r => { imgBsh.onload = r; });
      
      // 2. Création d'un Canvas 1080x1350
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      
      // 3. Enregistrement vidéo (6 secondes : 3s FR, 3s BSH)
      const stream = canvas.captureStream(30);
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
      else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) mimeType = 'video/webm;codecs=h264';
      
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_000_000,
      });
      
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      const blobPromise = new Promise(resolve => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });
      
      recorder.start();
      
      let isRecording = true;
      let currentImg = carouselOrder === "fr-first" ? imgFr : imgBsh;
      
      const renderLoop = () => {
        if (!isRecording) return;
        ctx.drawImage(currentImg, 0, 0, 1080, 1350);
        requestAnimationFrame(renderLoop);
      };
      renderLoop();
      
      await new Promise(r => setTimeout(r, 3000)); // 3 sec slide 1
      currentImg = carouselOrder === "fr-first" ? imgBsh : imgFr;
      await new Promise(r => setTimeout(r, 3000)); // 3 sec slide 2
      
      isRecording = false;
      recorder.stop();
      return await blobPromise;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handlePublish = async (targets) => {
    if (!publishCaption) {
      alert("Veuillez générer ou rédiger une légende.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      let combinedSuccess = true;
      let combinedMessage = "";

      // Si on cible Instagram et/ou Facebook, on génère les images
      if (targets.includes("instagram") || targets.includes("facebook")) {
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
        
        // Pass targets array as string to publishToMeta
        const metaTargets = targets.filter(t => t === 'instagram' || t === 'facebook');
        formData.append("targets", JSON.stringify(metaTargets));
        
        const res = await publishToMeta(formData);
        if (!res.success) {
          combinedSuccess = false;
          combinedMessage += `Meta Erreur: ${res.error}\n`;
        } else {
          combinedMessage += `✅ Meta publié (${metaTargets.join(', ')})\n`;
        }
      }

      // Si on cible TikTok, on génère la vidéo WebM
      if (targets.includes("tiktok")) {
        const videoBlob = await getCombinedVideoBlob();
        if (!videoBlob) {
          combinedSuccess = false;
          combinedMessage += `Erreur lors de la génération de la vidéo TikTok.\n`;
        } else {
          const formData = new FormData();
          formData.append("video", videoBlob, "tiktok.webm");
          formData.append("caption", publishCaption);
          formData.append("platform", "tiktok");
          
          const res = await fetch("/api/reels/publish", { method: "POST", body: formData });
          const data = await res.json();
          
          if (!res.ok) {
            combinedSuccess = false;
            combinedMessage += `TikTok Erreur: ${data.error}\n`;
          } else {
            combinedMessage += `✅ TikTok publié\n`;
          }
        }
      }

      alert(combinedMessage);
    } catch (e) {
      alert("Erreur système: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendToReaders = async () => {
    setIsSendingToReaders(true);
    try {
      const base64Fr = await getCanvasImage("fr");
      const base64Bsh = await getCanvasImage("bsh");

      if (!base64Fr && !base64Bsh) {
        alert("Erreur lors de la capture du visuel pour les lecteurs.");
        setIsSendingToReaders(false);
        return;
      }

      const formData = new FormData();
      if (base64Fr) formData.append("base64Image1", base64Fr);
      if (base64Bsh) formData.append("base64Image2", base64Bsh);
      formData.append("caption", publishCaption || "");
      formData.append("instagramTags", instagramTags || "");
      formData.append("articleId", article.id);

      const currentState = {
        templateData,
        carouselOrder,
        instagramTags,
        publishCaption,
        activeLang,
        selectedTemplateFr,
        selectedTemplateBsh,
        customImageUrl,
        imagePosX,
        imagePosY,
        imageZoom
      };
      formData.append("currentState", JSON.stringify(currentState));

      const res = await sendPostToReadersAction(formData);
      if (res.success) {
        setSentToReadersInfo({
          sent: true,
          sentAt: res.sentAt
        });
        alert("✅ Post envoyé avec succès aux lecteurs connectés !\n\nIl apparaît désormais directement dans leur tableau de bord personnel, sans avoir été publié sur les réseaux sociaux externes.");
      } else {
        alert("Erreur lors de l'envoi aux lecteurs : " + res.error);
      }
    } catch (e) {
      console.error("Erreur send to readers:", e);
      alert("Erreur système: " + e.message);
    } finally {
      setIsSendingToReaders(false);
    }
  };

  const handleUnsendFromReaders = async () => {
    if (!confirm("Voulez-vous retirer ce post du tableau de bord des lecteurs connectés ?")) return;
    setIsSendingToReaders(true);
    try {
      const res = await unsendPostFromReadersAction(article.id);
      if (res.success) {
        setSentToReadersInfo({ sent: false, sentAt: null });
        alert("✓ Le post a été retiré du tableau de bord des lecteurs.");
      } else {
        alert("Erreur: " + res.error);
      }
    } catch (e) {
      alert("Erreur: " + e.message);
    } finally {
      setIsSendingToReaders(false);
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

    title_bsh: article.title_bsh || article.title || "",
    body_bsh: article.hook_bsh || getInitialBody(),
    category_bsh: article.category || "Actualité",

    location: "CAYENNE",
    logoHeight: 75,
    date: getInitialDate(),
    source: "A FOLUKU TV",
    logoTheme: "white",
    showBreakingNews: false,
    showLogoNews: false,
    themeColor: "red",
  };

  // État indépendant pour CHAQUE template
  const [templateData, setTemplateData] = useState(() => {
    if (article.instagram_state?.templateData) return article.instagram_state.templateData;
    return {
      "template-1": { ...initialTemplateState },
      "template-2": { ...initialTemplateState },
      "template-3": { ...initialTemplateState, logoTheme: "black" },
      "template-4": { ...initialTemplateState },
      "template-5": { ...initialTemplateState },
    };
  });

  const [activeLang, setActiveLang] = useState(article.instagram_state?.activeLang || "fr"); // "fr" ou "bsh"
  const [selectedTemplateFr, setSelectedTemplateFr] = useState(article.instagram_state?.selectedTemplateFr || "template-2"); // default to Editorial Bleu
  const [selectedTemplateBsh, setSelectedTemplateBsh] = useState(
    article.instagram_state?.selectedTemplateBsh === "template-3"
      ? "template-2"
      : (article.instagram_state?.selectedTemplateBsh || "template-2")
  ); // default to Editorial Bleu (template-2) comme en FR

  // Gestion de l'image personnalisée & cadrage
  const [customImageUrl, setCustomImageUrl] = useState(
    article.instagram_state?.customImageUrl || ""
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef(null);
  const [imageRatioPreview, setImageRatioPreview] = useState("4-5"); // "4-5" | "1-1" | "16-9"

  // Position et Zoom
  const getInitialImagePos = () => {
    if (article.instagram_state?.imagePosX !== undefined && article.instagram_state?.imagePosY !== undefined) {
      return { x: article.instagram_state.imagePosX, y: article.instagram_state.imagePosY };
    }
    if (article.seo_metadata?.image_position) {
      const [xStr, yStr] = article.seo_metadata.image_position.split(" ");
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      return { x: !isNaN(x) ? x : 50, y: !isNaN(y) ? y : 50 };
    }
    return { x: 50, y: 50 };
  };

  const initialPos = getInitialImagePos();
  const [imagePosX, setImagePosX] = useState(initialPos.x);
  const [imagePosY, setImagePosY] = useState(initialPos.y);
  const [imageZoom, setImageZoom] = useState(
    article.instagram_state?.imageZoom ?? article.seo_metadata?.image_zoom ?? 100
  );

  const uploadToSupabaseStorage = async (fileOrBlobOrDataUri, folder = 'articles/social') => {
    if (!fileOrBlobOrDataUri) return null;
    let blob;
    let ext = 'jpg';

    if (typeof fileOrBlobOrDataUri === 'string') {
      if (fileOrBlobOrDataUri.startsWith('data:')) {
        const mimeMatch = fileOrBlobOrDataUri.match(/^data:([^;]+);base64,/);
        if (mimeMatch) {
          ext = mimeMatch[1].split('/')[1] || 'jpg';
          if (ext === 'jpeg') ext = 'jpg';
        }
        const res = await fetch(fileOrBlobOrDataUri);
        blob = await res.blob();
      } else {
        return fileOrBlobOrDataUri;
      }
    } else if (fileOrBlobOrDataUri instanceof Blob || fileOrBlobOrDataUri instanceof File) {
      blob = fileOrBlobOrDataUri;
      if (fileOrBlobOrDataUri.name) {
        ext = fileOrBlobOrDataUri.name.split('.').pop() || 'jpg';
      }
    } else {
      return null;
    }

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, blob, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error("Erreur lors de l'upload de l'image (Supabase):", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setCustomImageUrl(dataUrl);

      try {
        setIsUploadingImage(true);
        const uploadedUrl = await uploadToSupabaseStorage(file, 'articles/social');
        if (uploadedUrl) {
          setCustomImageUrl(uploadedUrl);
        }
      } catch (uploadErr) {
        console.warn("Upload Supabase social:", uploadErr);
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image active (personnalisée ou de l'article)
  const activeImageUrl = customImageUrl || article.image_url || "";

  // Utilisation du proxy d'image personnalisé pour éviter les problèmes CORS et de configuration Next.js
  const proxiedImageUrl = activeImageUrl
    ? (activeImageUrl.startsWith("data:") || activeImageUrl.startsWith("blob:")
        ? activeImageUrl
        : `/api/proxy-image?url=${encodeURIComponent(activeImageUrl)}`)
    : "";

  const postRefFr = useRef(null);
  const postRefBsh = useRef(null);

  // currentData corresponds au template actif pour la langue active
  const activeTemplate = activeLang === "fr" ? selectedTemplateFr : selectedTemplateBsh;
  const currentData = templateData[activeTemplate];
  const activeColors = colorThemes[currentData.themeColor] || colorThemes.red;

  // Auto-save
  useEffect(() => {
    const stateToSave = {
      templateData,
      carouselOrder,
      instagramTags,
      publishCaption,
      activeLang,
      selectedTemplateFr,
      selectedTemplateBsh,
      customImageUrl,
      imagePosX,
      imagePosY,
      imageZoom,
      sent_to_readers: sentToReadersInfo.sent,
      sent_to_readers_at: sentToReadersInfo.sentAt
    };
    
    const timeoutId = setTimeout(() => {
      saveInstagramState(article.id, stateToSave);
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeoutId);
  }, [
    templateData,
    carouselOrder,
    instagramTags,
    publishCaption,
    activeLang,
    selectedTemplateFr,
    selectedTemplateBsh,
    customImageUrl,
    imagePosX,
    imagePosY,
    imageZoom,
    sentToReadersInfo,
    article.id
  ]);

  const updateData = (field, value) => {
    // Fields that represent content should be synchronized across all templates
    const sharedFields = [
      "title_fr", "body_fr", "category_fr",
      "title_bsh", "body_bsh", "category_bsh",
      "date", "source", "location", "logoHeight"
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
    // Replace non-breaking spaces with regular spaces to prevent word-break issues
    return html.replace(/&nbsp;/g, ' ');
  };

  const generateAITitle = async () => {
    setIsGenerating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const promptFr = `Génère 1 seul titre très court, percutant et accrocheur pour un post Instagram. 
Voici l'article d'origine :
Titre : ${article.title}
Contenu : ${article.content || ''}
      
Formatte la réponse UNIQUEMENT en string, sans markdown, sans autre texte.`;

      const promptBsh = `Génère 1 seul titre très court, percutant et accrocheur en langue Bushinengé (langues de Guyane/Suriname comme le Ndyuka, Aluku, Pamaka ou Sranan Tongo) pour un post Instagram. 
IMPORTANT: NE TRADUIS SURTOUT PAS EN CRÉOLE HAÏTIEN, NI CRÉOLE ANTILLAIS.
Voici l'article d'origine (en français) :
Titre : ${article.title}
Contenu : ${article.content || ''}
      
Formatte la réponse UNIQUEMENT en string, sans markdown, sans autre texte.`;

      const res = await fetch("/api/ai/suggest-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activeLang === "fr" ? promptFr : promptBsh,
        }),
      });
      const data = await res.json();
      
      if (data.hook) {
        updateData(`title_${activeLang}`, data.hook);
        setSuccessMsg("Titre généré avec succès !");
      } else {
        setErrorMsg(data.error || "Erreur inconnue");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Une erreur est survenue lors de la génération du titre.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIHook = async () => {
    setIsGenerating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const promptFr = `Résume cet article en une version très courte (2 à 3 phrases maximum) allant à l'essentiel pour un post Instagram. 
Tu dois absolument mettre en gras (avec la balise HTML <strong>) les points clés ou les mots importants dans le résumé. 
INTERDICTION D'UTILISER DU MARKDOWN (aucun astérisque **). Utilise UNIQUEMENT la balise <strong> pour le gras.
De plus, extrais le nom de la source d'origine de l'article (ex: Le Monde, AFP, L'Equipe, etc.). Si aucune source n'est identifiable de manière évidente, utilise "A FOLUKU TV".
Tu DOIS renvoyer UNIQUEMENT un objet JSON valide avec cette structure exacte (sans bloc markdown):
{
  "hook": "Le résumé avec les balises <strong>...",
  "source": "Nom de la source"
}

Titre original: ${article.title}
Contenu: ${article.content || ''}`;

      const promptBsh = `Traduis LE RÉSUMÉ de cet article en langue Bushinengé (langues de Guyane/Suriname comme le Ndyuka, Aluku, Pamaka ou Sranan Tongo) en une version très courte (2 à 3 phrases maximum) allant à l'essentiel pour un post Instagram.
IMPORTANT: NE TRADUIS SURTOUT PAS EN CRÉOLE HAÏTIEN, NI CRÉOLE ANTILLAIS.
IMPORTANT: NE RENVOIE QUE LA VERSION TRADUITE EN BUSHINENGÉ. N'inclus SURTOUT PAS la version française.
Tu dois absolument mettre en gras (avec la balise HTML <strong>) les points clés ou les mots importants dans le résumé.
INTERDICTION D'UTILISER DU MARKDOWN (aucun astérisque **). Utilise UNIQUEMENT la balise <strong> pour le gras.
De plus, extrais le nom de la source d'origine de l'article (ex: Le Monde, AFP, L'Equipe, etc.). Si aucune source n'est identifiable de manière évidente, utilise "A FOLUKU TV".
Tu DOIS renvoyer UNIQUEMENT un objet JSON valide avec cette structure exacte (sans bloc markdown):
{
  "hook": "Le résumé traduit avec les balises <strong>...",
  "source": "Nom de la source"
}

Titre original: ${article.title}
Contenu: ${article.content || ''}`;
      
      const res = await fetch("/api/ai/suggest-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activeLang === "fr" ? promptFr : promptBsh,
        }),
      });
      const data = await res.json();
      
      if (data.hook) {
        let parsed;
        try {
          let cleaned = data.hook.replace(/```json/gi, '').replace(/```/g, '').trim();
          const start = cleaned.indexOf('{');
          const end = cleaned.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
             cleaned = cleaned.substring(start, end + 1);
          }
          parsed = JSON.parse(cleaned);
        } catch(e) {
          parsed = { hook: data.hook, source: "A FOLUKU TV" };
        }

        const htmlHook = parsed.hook.startsWith("<") 
          ? parsed.hook 
          : `<p>${parsed.hook.replace(/\n/g, '<br/>')}</p>`;
        
        // On met à jour directement le state global pour que ça s'affiche
        updateData(`body_${activeLang}`, htmlHook);
        if (parsed.source) {
          updateData("source", parsed.source);
        }
        setSuccessMsg("Résumé généré avec succès !");
        forceEditorRemount();
      } else {
        setErrorMsg(data.error || "Erreur lors de la génération de l'accroche.");
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la génération de l'accroche.");
    } finally {
      setIsGenerating(false);
    }
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
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${imagePosX}% ${imagePosY}%`,
              transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : "none",
              transformOrigin: `${imagePosX}% ${imagePosY}%`,
            }}
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
          className={`insta-body ${lang}`}
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
            wordBreak: "normal",
            overflowWrap: "break-word",
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
          whiteSpace: "nowrap",
          textAlign: "center",
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
          A FOLUKU TV &bull; Votre source d&apos;actualité culturelle et médiatique
        </span>
      </div>
      {renderBreakingNewsBanner()}
    </div>
  );


  const renderTemplate2 = (lang, ref) => {
    const isBsh = lang === "bsh";
    const bgImage = isBsh ? "/backgrounds/bg-template-bsh.png" : "/backgrounds/bg-template-fr.png";
    const subtitle = isBsh ? "WI MEDIA, WI KULTURU, WI TOLI" : "NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES";
    const category = currentData[`category_${lang}`] || (isBsh ? "POLITIKI" : "POLITIQUE");
    const readMore = isBsh ? "Yu sa go leisi ala sani fini fini na a web site : www.afolukutv.com" : "Plus de détails sur notre site web.";
    const articleBtn = isBsh ? "Article compleet" : "Article complet";
    const titleColor = isBsh ? "#0d069b" : "#ffffff";
    const bodyColor = isBsh ? "#1a1a1a" : "#ffffff";
    const ctaColor = isBsh ? "#333" : "#ffffff";
    const breakingText = isBsh ? "SAN PASA NYUNSU" : "BREAKING NEWS";
    const sourceText = isBsh ? "FOLLOW " : "SUIVEZ ";

    return (
    <div
      ref={ref}
      style={{
        width: "1080px",
        height: "1350px",
        backgroundImage: `url(${bgImage})`,
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
        padding: "0px 30px 14px 30px",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        flexShrink: 0,
        gap: "24px",
      }}>
        {/* Left: Logo + NEWS badge + Tagline */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0 }}>
          <img 
            src="/afoluku-tv-logo.png" 
            alt="AFOLUKU TV" 
            style={{ 
              height: `${currentData.logoHeight || 75}px`, 
              objectFit: "contain", 
              objectPosition: "left", 
              marginTop: "4px" 
            }} 
            crossOrigin="anonymous" 
          />
          <div style={{ display: "flex", alignItems: "center", marginTop: "12px", gap: "14px", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#e41318", color: "#fff", padding: "1px 18px", borderRadius: "8px", fontWeight: "900", fontSize: "24px", letterSpacing: "2px", WebkitTextStroke: "1px #fff", flexShrink: 0 }}>
              NEWS
            </div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#fff", letterSpacing: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {subtitle}
            </div>
          </div>
        </div>
        {/* Right: Date + Category */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", paddingTop: "4px", flexShrink: 0, minWidth: "max-content" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginTop: "24px", whiteSpace: "nowrap", textAlign: "right" }}>
            {currentData.date}
          </div>
          <div style={{ backgroundColor: "#ffce00", color: "#000", padding: "6px 20px", fontWeight: "900", fontSize: "22px", borderRadius: "4px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {category}
          </div>
        </div>
      </div>

      {/* ── MAIN IMAGE ── */}
      <div style={{ width: "100%", height: "500px", position: "relative", flexShrink: 0, overflow: "hidden" }}>
        {proxiedImageUrl && (
          <img
            src={proxiedImageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${imagePosX}% ${imagePosY}%`,
              transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : "none",
              transformOrigin: `${imagePosX}% ${imagePosY}%`,
              display: "block"
            }}
            alt="Hero"
            crossOrigin="anonymous"
          />
        )}
      </div>

      {/* ── BREAKING NEWS & LOCATION ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", flexShrink: 0, overflow: "visible" }}>
        {/* Left red gradient block with broadcast icon + text */}
        <div style={{
          background: "linear-gradient(to right, #0d069b, #e41318)",
          color: "#fff",
          padding: "12px 35px",
          display: "flex",
          alignItems: "center",
          transform: "skewX(-15deg)",
          marginLeft: "-15px" // To keep it anchored to the left edge despite the skew
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", transform: "skewX(15deg)", marginLeft: "15px" }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
              <path d="M8 8.5a5 5 0 0 0 0 7" /><path d="M5 5.5a9 9 0 0 0 0 13" />
              <path d="M16 8.5a5 5 0 0 1 0 7" /><path d="M19 5.5a9 9 0 0 1 0 13" />
            </svg>
            <span style={{ fontFamily: "'Anton', sans-serif", fontStyle: "italic", fontSize: "62px", letterSpacing: "2px", lineHeight: "1" }}>
              {breakingText}
            </span>
          </div>
        </div>

        {/* ── LOCATION BADGE (RIGHT) ── */}
        <div style={{ backgroundColor: "#ffce00", padding: "8px 35px", display: "flex", alignItems: "center", flexShrink: 0, transform: "skewX(15deg)", marginRight: "-15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", transform: "skewX(-15deg)", marginRight: "15px" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0d069b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
              <circle cx="12" cy="10" r="3" fill="#0d069b" stroke="none" />
            </svg>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontStyle: "italic", fontSize: "42px", fontWeight: "900", background: "linear-gradient(to right, #0d069b, #e41318)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block", paddingRight: "8px", whiteSpace: "nowrap" }}>
              {currentData.location || "CAYENNE"}
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ flex: 1, padding: "22px 35px 15px 35px", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* Title */}
        <div className="insta-title" style={{ color: titleColor, fontSize: `${currentData[`titleFontSize_${lang}`] || 40}px`, fontWeight: "900", lineHeight: currentData[`titleLineHeight_${lang}`] || 1.15, textTransform: "uppercase", marginBottom: "16px", position: "relative" }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[`title_${lang}`]) }} />
        {/* Body */}
        <div className={`insta-body ${lang}`} style={{ fontSize: "24px", lineHeight: currentData[`bodyLineHeight_${lang}`] || 1.6, color: bodyColor, overflow: "hidden", position: "relative", textAlign: "justify" }}
          dangerouslySetInnerHTML={{ __html: cleanHtmlForDisplay(currentData[`body_${lang}`]) }} />
        {/* Italic CTA */}
        <div style={{ borderLeft: `4px solid ${isBsh ? '#0d069b' : '#ffce00'}`, paddingLeft: "18px", marginTop: "18px", fontStyle: "italic", fontSize: "25px", fontWeight: "600", color: ctaColor, lineHeight: "1.4", position: "relative" }}>
          {readMore}
        </div>
      </div>

      {/* ── SOURCE OVERLAY ── */}
      <div style={{ position: "absolute", bottom: "85px", left: "260px", display: "flex", alignItems: "center", zIndex: 20 }}>
        <span style={{ color: "#fff", fontWeight: "bold", fontSize: "18px" }}>{currentData.source}</span>
      </div>
    </div>
    );
  };

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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${imagePosX}% ${imagePosY}%`,
            transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : "none",
            transformOrigin: `${imagePosX}% ${imagePosY}%`,
          }}
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
            whiteSpace: "nowrap",
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
            AFOLUKU
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
          className={`insta-body ${lang}`}
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
        <i className="fas fa-globe-americas"></i> AFOLUKUTV
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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${imagePosX}% ${imagePosY}%`,
            transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : "none",
            transformOrigin: `${imagePosX}% ${imagePosY}%`,
          }}
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
          fontSize: "28px",
          fontWeight: "bold",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          textAlign: "center",
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
          className={`insta-body ${lang}`}
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
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${imagePosX}% ${imagePosY}%`,
            transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : "none",
            transformOrigin: `${imagePosX}% ${imagePosY}%`,
          }}
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
            AFOLUKUTV
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
          className={`insta-body ${lang}`}
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

  
  const renderTemplateFlash = (lang, ref) => {
    return (
      <div ref={ref} style={{ width: '1080px', height: '1350px', background: 'linear-gradient(135deg, #e41318 0%, #8b0000 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ backgroundColor: '#ffce00', color: '#000', padding: '10px 40px', fontSize: '80px', fontWeight: '900', fontStyle: 'italic', fontFamily: 'Anton, sans-serif' }}>FLASH INFO</div>
      </div>
    );
  };
return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        /* Styles pour Instagram Post (wrap, points clés en jaune et très gras) */
        .insta-body {
          word-break: normal;
          overflow-wrap: break-word;
          white-space: pre-wrap !important;
        }
        .insta-body strong {
          font-weight: 900 !important;
        }
        .insta-body.fr strong {
          color: #facc15 !important;
        }
        .insta-body.bsh strong {
          color: #1e3a8a !important; /* Bleu foncé */
        }
        .insta-body ul {
          list-style-type: disc !important;
          padding-left: 40px !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        .insta-body ol {
          list-style-type: decimal !important;
          padding-left: 40px !important;
          margin-top: 10px !important;
          margin-bottom: 10px !important;
        }
        .insta-body li {
          margin-bottom: 8px !important;
          display: list-item !important;
        }
        .insta-body * {
          line-height: inherit !important;
        }
        .insta-title {
          word-break: normal;
          overflow-wrap: break-word;
        }
        .insta-title * {
          font-size: inherit !important;
          line-height: inherit !important;
          margin: 0 !important;
          padding: 0 !important;
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
                  className="fas fa-share-alt"
                  style={{ color: "#E1306C", marginRight: "8px" }}
                ></i>{" "}
                SocialPost
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
                      setSelectedTemplateFr(tpl.id);
                      setSelectedTemplateBsh(tpl.id);
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

            {/* ── AJUSTEUR & REMPLACEMENT DE PHOTO SOCIAL POST ── */}
            <div style={{
              marginBottom: "25px",
              backgroundColor: "#f8fafc",
              border: "1.5px solid #cbd5e1",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                    <i className="fas fa-camera"></i>
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>2. Photo du Post Social</strong>
                    <span style={{ fontSize: "11.5px", color: customImageUrl ? "#2563eb" : "#64748b", fontWeight: customImageUrl ? "600" : "normal" }}>
                      {customImageUrl ? "✓ Photo personnalisée pour ce post" : "Photo originale de l'article"}
                    </span>
                  </div>
                </div>
                {customImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomImageUrl("")}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11.5px",
                      fontWeight: "600",
                      borderRadius: "6px",
                      border: "1px solid #f87171",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                    title="Revenir à l'image principale de l'article"
                  >
                    <i className="fas fa-undo"></i> Rétablir photo article
                  </button>
                )}
              </div>

              {/* Remplacement : Téléversement ou URL */}
              <div style={{ marginBottom: "12px" }}>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageFileChange}
                />
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: isUploadingImage ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 1px 3px rgba(37,99,235,0.3)"
                    }}
                  >
                    {isUploadingImage ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
                    {isUploadingImage ? "Téléversement..." : "Changer la photo (Fichier)"}
                  </button>
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="Ou coller une URL d'image (https://...)"
                    value={customImageUrl || ""}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="admin-form-control"
                    style={{ fontSize: "12px", padding: "6px 10px" }}
                  />
                </div>
              </div>

              {/* Ajusteur interactif si une image est active */}
              {activeImageUrl ? (
                <div>
                  {/* Raccourcis Rapides */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                      <i className="fas fa-crop-alt" style={{ marginRight: "4px", color: "#2563eb" }}></i>
                      Cadrage :
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "3px", flexWrap: "wrap" }}>
                      {[
                        { label: "⬆️ Haut", x: 50, y: 15 },
                        { label: "🎯 Centre", x: 50, y: 50 },
                        { label: "⬇️ Bas", x: 50, y: 85 },
                        { label: "⬅️ G.", x: 15, y: 50 },
                        { label: "➡️ D.", x: 85, y: 50 },
                        { label: "↺ Reset", x: 50, y: 50, z: 100 }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImagePosX(preset.x);
                            setImagePosY(preset.y);
                            if (preset.z) setImageZoom(preset.z);
                          }}
                          style={{
                            padding: "3px 6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            borderRadius: "5px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: imagePosX === preset.x && imagePosY === preset.y ? "#2563eb" : "#fff",
                            color: imagePosX === preset.x && imagePosY === preset.y ? "#fff" : "#334155",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zone d'aperçu interactive avec réticule de point focal */}
                  <div style={{ position: "relative", marginBottom: "10px" }}>
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
                        const clickY = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
                        setImagePosX(clickX);
                        setImagePosY(clickY);
                      }}
                      style={{
                        position: "relative",
                        width: "100%",
                        height: imageRatioPreview === "4-5" ? "250px" : (imageRatioPreview === "1-1" ? "210px" : "160px"),
                        borderRadius: "10px",
                        overflow: "hidden",
                        backgroundColor: "#090d16",
                        border: "2px solid #94a3b8",
                        cursor: "crosshair",
                        userSelect: "none",
                        transition: "height 0.2s ease"
                      }}
                    >
                      <img
                        src={activeImageUrl}
                        alt="Aperçu cadrage"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: `${imagePosX}% ${imagePosY}%`,
                          transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : "none",
                          transformOrigin: `${imagePosX}% ${imagePosY}%`,
                          transition: "object-position 0.1s ease, transform 0.1s ease",
                          pointerEvents: "none"
                        }}
                      />

                      {/* Viseur / Cible */}
                      <div
                        style={{
                          position: "absolute",
                          left: `${imagePosX}%`,
                          top: `${imagePosY}%`,
                          transform: "translate(-50%, -50%)",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          border: "2px solid #fff",
                          boxShadow: "0 0 0 2px #2563eb, 0 4px 12px rgba(0,0,0,0.5)",
                          pointerEvents: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "left 0.1s ease, top 0.1s ease"
                        }}
                      >
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2563eb" }}></div>
                      </div>

                      {/* Badges d'état */}
                      <div style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        fontSize: "10.5px",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}>
                        <i className="fas fa-crosshairs" style={{ color: "#60a5fa" }}></i>
                        X: {imagePosX}% | Y: {imagePosY}% {imageZoom > 100 ? `| Zoom: ${imageZoom}%` : ""}
                      </div>
                    </div>

                    {/* Ratios & aide */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748b" }}>
                      <span>💡 Cliquez sur l'image pour cadrer le sujet</span>
                      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                        {["4-5", "1-1", "16-9"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setImageRatioPreview(r)}
                            style={{
                              fontSize: "10px",
                              padding: "2px 5px",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              backgroundColor: imageRatioPreview === r ? "#e2e8f0" : "#fff",
                              fontWeight: imageRatioPreview === r ? "700" : "500",
                              cursor: "pointer"
                            }}
                          >
                            {r === "4-5" ? "4:5 (Post)" : (r === "1-1" ? "1:1" : "16:9")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Curseurs X, Y et Zoom */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", paddingTop: "4px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#334155", marginBottom: "2px" }}>
                        <span style={{ fontWeight: "600" }}>X (Horiz.)</span>
                        <span style={{ fontWeight: "700", color: "#2563eb" }}>{imagePosX}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePosX}
                        onChange={(e) => setImagePosX(Number(e.target.value))}
                        style={{ width: "100%", cursor: "pointer" }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#334155", marginBottom: "2px" }}>
                        <span style={{ fontWeight: "600" }}>Y (Vertic.)</span>
                        <span style={{ fontWeight: "700", color: "#2563eb" }}>{imagePosY}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePosY}
                        onChange={(e) => setImagePosY(Number(e.target.value))}
                        style={{ width: "100%", cursor: "pointer" }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#334155", marginBottom: "2px" }}>
                        <span style={{ fontWeight: "600" }}>Zoom</span>
                        <span style={{ fontWeight: "700", color: "#2563eb" }}>{imageZoom}%</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="200"
                        step="5"
                        value={imageZoom}
                        onChange={(e) => setImageZoom(Number(e.target.value))}
                        style={{ width: "100%", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "20px",
                  textAlign: "center",
                  border: "2px dashed #cbd5e1",
                  borderRadius: "8px",
                  color: "#64748b",
                  fontSize: "12.5px"
                }}>
                  <i className="fas fa-image" style={{ fontSize: "28px", color: "#94a3b8", marginBottom: "8px", display: "block" }}></i>
                  Aucune photo disponible. Téléversez une photo ou collez une URL ci-dessus.
                </div>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  3. Titre (Gros texte) ({activeLang === "fr" ? "FR" : "BSH"}) :
                </label>
                <button
                  onClick={generateAITitle}
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
                  {activeLang === "fr" ? "Générer Titre" : "Générer Titre BSH"}
                </button>
              </div>
              <div style={{ backgroundColor: "#fff", border: "1px solid #d1d5db", borderRadius: "6px" }}>
                <CustomEditor
                  value={currentData[`title_${activeLang}`]}
                  onChange={(val) => updateData(`title_${activeLang}`, val)}
                />
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                <label style={{ fontSize: "14px", fontWeight: "bold", width: "160px" }}>Taille du titre ({currentData[`titleFontSize_${activeLang}`] || 40}px)</label>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="2"
                  value={currentData[`titleFontSize_${activeLang}`] || 40}
                  onChange={(e) => updateData(`titleFontSize_${activeLang}`, parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                <label style={{ fontSize: "14px", fontWeight: "bold", width: "160px" }}>Interligne du titre ({currentData[`titleLineHeight_${activeLang}`] || 1.15})</label>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={currentData[`titleLineHeight_${activeLang}`] || 1.15}
                  onChange={(e) => updateData(`titleLineHeight_${activeLang}`, parseFloat(e.target.value))}
                  style={{ flex: 1 }}
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
                {activeLang === "fr" ? "Générer Résumé" : "Générer Résumé BSH"}
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
            
            <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "14px", fontWeight: "bold", width: "180px" }}>Interligne du texte ({currentData[`bodyLineHeight_${activeLang}`] || 1.6})</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={currentData[`bodyLineHeight_${activeLang}`] || 1.6}
                onChange={(e) => updateData(`bodyLineHeight_${activeLang}`, parseFloat(e.target.value))}
                style={{ flex: 1 }}
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

            {activeTemplate === "template-2" && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  📍 Lieu (Badge jaune à droite) :
                </label>
                <input
                  type="text"
                  value={currentData.location || "CAYENNE"}
                  onChange={(e) => updateData("location", e.target.value.toUpperCase())}
                  className="admin-form-control"
                  placeholder="Ex: CAYENNE, KOUROU, ST-LAURENT, APATOU..."
                  style={{ fontWeight: "bold" }}
                />
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  {["CAYENNE", "KOUROU", "ST-LAURENT", "MATOURY", "REMIRE", "APATOU", "MARIPASOULA", "MANA", "GRAND-SANTI"].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => updateData("location", city)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        borderRadius: "4px",
                        border: "1px solid #d1d5db",
                        backgroundColor: (currentData.location || "CAYENNE") === city ? "#ffce00" : "#f3f4f6",
                        color: (currentData.location || "CAYENNE") === city ? "#000" : "#374151",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTemplate === "template-2" && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  Taille du logo AFOLUKU TV ({currentData.logoHeight || 75}px) :
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="range"
                    min="50"
                    max="110"
                    step="5"
                    value={currentData.logoHeight || 75}
                    onChange={(e) => updateData("logoHeight", parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: "#e41318" }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: "bold", minWidth: "45px" }}>
                    {currentData.logoHeight || 75}px
                  </span>
                  <button
                    type="button"
                    onClick={() => updateData("logoHeight", 75)}
                    style={{
                      padding: "2px 8px",
                      fontSize: "11px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    Défaut (75px)
                  </button>
                </div>
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

              {/* Lien Court Rapide */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f8fafc",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                marginBottom: "8px",
                fontSize: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                  <i className="fas fa-link" style={{ color: "#2563eb" }}></i>
                  <span>Lien court :</span>
                  <code style={{ fontWeight: "bold", color: "#0f172a", backgroundColor: "#e2e8f0", padding: "1px 6px", borderRadius: "4px" }}>
                    /a/{article.id}
                  </code>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const shortUrl = `${window.location.origin}/a/${article.id}`;
                      navigator.clipboard.writeText(shortUrl);
                      alert(`Lien court copié : ${shortUrl}`);
                    }}
                    style={{
                      padding: "3px 8px",
                      fontSize: "11px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                      color: "#334155",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                    title="Copier le lien court"
                  >
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const shortUrl = `${window.location.origin}/a/${article.id}`;
                      setPublishCaption(prev => prev ? `${prev}\n\n👉 Lire l'article : ${shortUrl}` : `👉 Lire l'article : ${shortUrl}`);
                    }}
                    style={{
                      padding: "3px 8px",
                      fontSize: "11px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      cursor: "pointer",
                      fontWeight: "700"
                    }}
                    title="Insérer le lien court à la fin de la légende"
                  >
                    + Insérer
                  </button>
                </div>
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

              {/* ── SECTION EXCLUSIVE : DIFFUSION TABLEAU DE BORD LECTEURS ── */}
              <div style={{
                marginBottom: "20px",
                padding: "14px",
                backgroundColor: "#f0fdf4",
                borderRadius: "10px",
                border: "1.5px solid #86efac",
                boxShadow: "0 2px 6px rgba(16,185,129,0.08)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                      <i className="fas fa-users"></i>
                    </div>
                    <strong style={{ fontSize: "13px", color: "#14532d" }}>Tableau de bord Lecteurs</strong>
                  </div>
                  {sentToReadersInfo.sent && (
                    <span style={{ fontSize: "11px", backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "12px", fontWeight: "700", border: "1px solid #bbf7d0" }}>
                      ✓ En ligne pour les membres
                    </span>
                  )}
                </div>

                <p style={{ fontSize: "11.5px", color: "#166534", margin: "0 0 10px 0", lineHeight: "1.4" }}>
                  Diffusez ce visuel directement dans le tableau de bord des abonnés connectés d'A FOLUKU TV (<strong>sans publication sur les réseaux sociaux externes</strong>).
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={handleSendToReaders}
                    disabled={isSendingToReaders || isPublishing || isSaving}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "7px",
                      fontWeight: "bold",
                      fontSize: "13px",
                      cursor: (isSendingToReaders || isPublishing || isSaving) ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                    }}
                  >
                    {isSendingToReaders ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                    {sentToReadersInfo.sent ? "Mettre à jour pour les lecteurs" : "Envoyer aux lecteurs"}
                  </button>

                  {sentToReadersInfo.sent && (
                    <button
                      type="button"
                      onClick={handleUnsendFromReaders}
                      disabled={isSendingToReaders}
                      style={{
                        width: "100%",
                        padding: "5px 10px",
                        backgroundColor: "transparent",
                        color: "#dc2626",
                        border: "1px dashed #fca5a5",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        marginTop: "2px"
                      }}
                    >
                      <i className="fas fa-eye-slash" style={{ marginRight: "4px" }}></i>
                      Retirer du tableau de bord des lecteurs
                    </button>
                  )}
                </div>

                {sentToReadersInfo.sentAt && (
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "#15803d", textAlign: "center" }}>
                    Dernier envoi : {new Date(sentToReadersInfo.sentAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: "15px", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Publication Réseaux Sociaux (Meta & TikTok)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handlePublish(['instagram'])}
                  disabled={isPublishing || isSaving}
                  className="admin-btn"
                  style={{ 
                    width: "100%", padding: "10px", 
                    background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                    color: "white", border: "none", fontWeight: "bold",
                    cursor: (isPublishing || isSaving) ? "not-allowed" : "pointer",
                    opacity: (isPublishing || isSaving) ? 0.7 : 1
                  }}
                >
                  {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-instagram"></i>}
                  {" "}Publier sur Instagram
                </button>

                <button
                  onClick={() => handlePublish(['facebook'])}
                  disabled={isPublishing || isSaving}
                  className="admin-btn"
                  style={{ 
                    width: "100%", padding: "10px", 
                    backgroundColor: "#1877F2",
                    color: "white", border: "none", fontWeight: "bold",
                    cursor: (isPublishing || isSaving) ? "not-allowed" : "pointer",
                    opacity: (isPublishing || isSaving) ? 0.7 : 1
                  }}
                >
                  {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-facebook"></i>}
                  {" "}Publier sur Facebook
                </button>

                <button
                  onClick={() => handlePublish(['tiktok'])}
                  disabled={isPublishing || isSaving}
                  className="admin-btn"
                  style={{ 
                    width: "100%", padding: "10px", 
                    backgroundColor: "#000000",
                    color: "white", border: "none", fontWeight: "bold",
                    cursor: (isPublishing || isSaving) ? "not-allowed" : "pointer",
                    opacity: (isPublishing || isSaving) ? 0.7 : 1
                  }}
                >
                  {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-tiktok"></i>}
                  {" "}Publier sur TikTok
                </button>

                <button
                  onClick={() => handlePublish(['instagram', 'facebook', 'tiktok'])}
                  disabled={isPublishing || isSaving}
                  className="admin-btn"
                  style={{ 
                    width: "100%", padding: "10px", 
                    backgroundColor: "#10b981",
                    color: "white", border: "none", fontWeight: "bold",
                    cursor: (isPublishing || isSaving) ? "not-allowed" : "pointer",
                    opacity: (isPublishing || isSaving) ? 0.7 : 1,
                    marginTop: "5px"
                  }}
                >
                  {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-share-alt"></i>}
                  {" "}Tout publier
                </button>
              </div>
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
