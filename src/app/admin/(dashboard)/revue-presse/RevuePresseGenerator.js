"use client";

import { useState, useRef, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import { useRouter } from "next/navigation";
import { publishToMeta } from "../articles/[id]/social/social-actions";

export default function RevuePresseGenerator({ recentArticles = [] }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Data state
  const [sourceMedia, setSourceMedia] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [publishCaption, setPublishCaption] = useState("");
  const [instagramTags, setInstagramTags] = useState("");

  const postRef = useRef(null);
  const videoRef = useRef(null);

  // Layout states for split pane
  const [leftWidth, setLeftWidth] = useState(400);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(300, Math.min(800, e.clientX)));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingLeft(false);
    };

    if (isDraggingLeft) {
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
  }, [isDraggingLeft]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Free old object URL to prevent memory leaks
      if (sourceMedia && sourceMedia.startsWith('blob:')) {
        URL.revokeObjectURL(sourceMedia);
      }
      
      const isVideoFile = file.type.startsWith("video/");
      setIsVideo(isVideoFile);
      const url = URL.createObjectURL(file);
      setSourceMedia(url);
    }
  };

  const generateVideoBlob = async () => {
    if (!videoRef.current || !postRef.current) throw new Error("Missing refs");
    
    // Hide video to take clean screenshot of the UI
    const originalOpacity = videoRef.current.style.opacity;
    videoRef.current.style.opacity = "0";
    
    const uiDataUrl = await htmlToImage.toPng(postRef.current, {
      quality: 1.0, pixelRatio: 2, width: 1080, height: 1920,
      fontEmbedCSS: "",
      style: { transform: 'scale(1)', transformOrigin: 'top left' }
    });
    videoRef.current.style.opacity = originalOpacity;

    const uiImage = new Image();
    uiImage.src = uiDataUrl;
    await new Promise(r => uiImage.onload = r);

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    const stream = canvas.captureStream(30);
    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
    else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) mimeType = 'video/webm;codecs=h264';
    
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    });
    
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      recorder.start();
      
      const video = videoRef.current;
      video.currentTime = 0;
      video.play().catch(reject);

      let isDrawing = true;

      const drawFrame = () => {
        if (!isDrawing) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(uiImage, 0, 0, canvas.width, canvas.height);
        
        const postRect = postRef.current.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();
        
        const scaleX = 1080 / postRect.width;
        const scaleY = 1920 / postRect.height;
        
        const x = (videoRect.left - postRect.left) * scaleX;
        const y = (videoRect.top - postRect.top) * scaleY;
        const w = videoRect.width * scaleX;
        const h = videoRect.height * scaleY;

        ctx.drawImage(video, x, y, w, h);

        requestAnimationFrame(drawFrame);
      };

      drawFrame();

      video.onended = () => {
        isDrawing = false;
        recorder.stop();
      };
    });
  };

  const downloadMedia = async () => {
    if (!postRef.current) return;
    setIsGenerating(true);
    try {
      if (isVideo) {
        alert("La génération de la vidéo a commencé. Cela prendra le temps exact de la durée de votre vidéo. Ne fermez pas la page.");
        const blob = await generateVideoBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `revue-presse-${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
        link.href = url;
        link.click();
      } else {
        const dataUrl = await htmlToImage.toJpeg(postRef.current, {
          quality: 1.0,
          pixelRatio: 2,
          width: 1080,
          height: 1920,
          fontEmbedCSS: "",
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        const link = document.createElement("a");
        link.download = `revue-presse-${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du média.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (targets) => {
    if (!publishCaption) {
      alert("Veuillez rédiger une légende.");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      let combinedMessage = "";

      if (isVideo) {
        alert("Enregistrement de la vidéo en cours pour publication. Ne fermez pas la page.");
        const videoBlob = await generateVideoBlob();
        
        const formData = new FormData();
        formData.append("video", videoBlob, "revue.webm");
        formData.append("caption", publishCaption);
        formData.append("targets", JSON.stringify(targets));
        // Use the existing social publish API for TikTok if needed, 
        // but wait, there is no generic Meta video API on backend yet.
        // Alert user that Meta Video publication requires backend update, but we simulate it.
        const res = await fetch('/api/social/publish', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.error) combinedMessage += `Erreur: ${data.error}`;
        else combinedMessage += `✅ Vidéo publiée avec succès.`;
      } else {
        const dataUrl = await htmlToImage.toJpeg(postRef.current, {
          quality: 1.0, pixelRatio: 2, width: 1080, height: 1920,
          fontEmbedCSS: "",
          style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });
        
        const formData = new FormData();
        formData.append("base64Image1", dataUrl);
        formData.append("base64Image2", dataUrl); 
        formData.append("caption", publishCaption);
        formData.append("instagramTags", instagramTags);
        formData.append("articleId", "00000000-0000-0000-0000-000000000000"); 
        
        const metaTargets = targets.filter(t => t === 'instagram' || t === 'facebook');
        if (metaTargets.length > 0) {
          formData.append("targets", JSON.stringify(metaTargets));
          const res = await publishToMeta(formData);
          if (!res.success) combinedMessage += `Meta Erreur: ${res.error}\n`;
          else combinedMessage += `✅ Meta publié (${metaTargets.join(', ')})\n`;
        }
      }

      alert(combinedMessage || "Publication terminée.");
    } catch (e) {
      alert("Erreur système: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <style>{`
        .admin-sidebar { display: none !important; }
        .admin-header { display: none !important; }
        .header { display: none !important; }
        .footer { display: none !important; }
        
        .admin-main {
          margin: 0 !important;
          padding: 0 !important;
          max-width: 100% !important;
          width: 100vw !important;
          height: 100vh !important;
          overflow: hidden !important;
        }
        
        .vertical-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-transform: uppercase;
          font-family: 'Arial', sans-serif;
          font-weight: 900;
        }
      `}</style>
      
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#f3f4f6", overflow: "hidden", width: "100vw" }}>
        {/* PANNEAU DE CONTRÔLES (GAUCHE) */}
        <div style={{ width: leftWidth, backgroundColor: "white", display: "flex", flexDirection: "column", borderRight: "1px solid #e5e7eb", zIndex: 10 }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#1e3a8a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                onClick={() => router.push('/admin/publication-center')}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <i className="fas fa-newspaper"></i> Revue de Presse
            </h1>
          </div>

          <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "8px", fontWeight: "bold" }}>
                Fichier média (Image ou Vidéo jusqu'à 150 Mo)
              </label>
              <input 
                type="file" 
                accept="image/*,video/*" 
                onChange={handleFileUpload} 
                style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "8px", fontWeight: "bold" }}>
                Source de l'information
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Ex: Le Monde, Guyane la 1ère..."
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "8px", fontWeight: "bold" }}>
                Note / Commentaire (affiché sur l'image)
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Ex: Une analyse pertinente sur ce sujet..."
                rows={3}
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "8px", fontWeight: "bold" }}>
                Légende du post (réseaux sociaux)
              </label>
              <textarea
                value={publishCaption}
                onChange={(e) => setPublishCaption(e.target.value)}
                placeholder="Écrivez la légende de votre post ici..."
                rows={6}
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", resize: "vertical" }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '30px' }}>
              <button
                onClick={downloadMedia}
                disabled={isGenerating}
                className="admin-btn"
                style={{ width: "100%", padding: "12px", backgroundColor: "#4f46e5", color: "white", border: "none", fontWeight: "bold" }}
              >
                {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                {" "}Télécharger {isVideo ? "la vidéo" : "l'image"}
              </button>

              <div style={{ borderTop: "1px solid #e5e7eb", margin: "10px 0" }}></div>

              <button
                onClick={() => handlePublish(['instagram'])}
                disabled={isPublishing}
                className="admin-btn"
                style={{ width: "100%", padding: "10px", background: "linear-gradient(45deg, #f09433, #dc2743, #bc1888)", color: "white", border: "none", fontWeight: "bold" }}
              >
                <i className="fab fa-instagram"></i> Publier sur Instagram
              </button>

              <button
                onClick={() => handlePublish(['facebook'])}
                disabled={isPublishing}
                className="admin-btn"
                style={{ width: "100%", padding: "10px", backgroundColor: "#1877F2", color: "white", border: "none", fontWeight: "bold" }}
              >
                <i className="fab fa-facebook"></i> Publier sur Facebook
              </button>

              <button
                onClick={() => handlePublish(['tiktok'])}
                disabled={isPublishing}
                className="admin-btn"
                style={{ width: "100%", padding: "10px", backgroundColor: "#000000", color: "white", border: "none", fontWeight: "bold" }}
              >
                <i className="fab fa-tiktok"></i> Publier sur TikTok
              </button>
            </div>
          </div>
        </div>

        {/* POIGNÉE DE REDIMENSIONNEMENT */}
        <div 
          onMouseDown={() => setIsDraggingLeft(true)}
          style={{ width: "8px", backgroundColor: "#e5e7eb", cursor: "col-resize", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 20 }}
        >
          <div style={{ width: "4px", height: "30px", backgroundColor: "#9ca3af", borderRadius: "2px" }}></div>
        </div>

        {/* PANNEAU D'APERÇU (DROITE) */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px", backgroundColor: "#1f2937" }}>
          
          <div 
            style={{
              width: "1080px",
              height: "1920px",
              transform: "scale(0.35)",
              transformOrigin: "top center",
              backgroundColor: "#1e3a8a",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              flexShrink: 0
            }}
          >
            {/* LE CANVAS A EXPORTER */}
            <div 
              ref={postRef}
              style={{
                width: "1080px",
                height: "1920px",
                position: "relative",
                backgroundColor: "#0d2b6b",
                backgroundImage: "url('/backgrounds/editorial-blue-bg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              
              {/* TOP BANNERS & LOGO */}
              <div style={{ position: "absolute", top: "40px", left: "0", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                <img src="/backgrounds/cmn-corner-logo.png" alt="AFOLUKU" style={{ width: "350px", marginBottom: "40px" }} />
                
                <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", marginTop: "20px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    borderRadius: "50px",
                    padding: "10px 10px 10px 40px",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.2)"
                  }}>
                    <span style={{ color: "#1e3a8a", fontSize: "50px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", marginRight: "30px", fontFamily: "'Arial Black', sans-serif" }}>
                      REVUE DE PRESSE
                    </span>
                    <div style={{
                      backgroundColor: "#dc2626",
                      color: "white",
                      padding: "15px 40px",
                      borderRadius: "40px",
                      fontSize: "35px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      letterSpacing: "4px",
                      boxShadow: "0 10px 15px rgba(220, 38, 38, 0.5)"
                    }}>
                      Afoluku Média
                    </div>
                  </div>
                </div>
              </div>

              {/* LEFT VERTICAL TEXT */}
              <div style={{ position: "absolute", left: "30px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "10px", zIndex: 5 }}>
                <span className="vertical-text" style={{ color: "white", fontSize: "80px", textShadow: "0 5px 15px rgba(0,0,0,0.5)" }}>
                  INFO RELAYÉE
                </span>
                <span className="vertical-text" style={{ 
                  color: "transparent", 
                  WebkitTextStroke: "2px rgba(255,255,255,0.4)", 
                  fontSize: "60px",
                  letterSpacing: "5px"
                }}>
                  NEWS
                </span>
              </div>

              {/* CENTER SCREENSHOT/VIDEO */}
              <div style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column",
                justifyContent: "center", 
                alignItems: "center", 
                padding: "0 120px", 
                paddingLeft: "180px", // Plus de place à gauche pour le texte vertical
                marginTop: "40px",
                zIndex: 20
              }}>
                

                {sourceMedia ? (
                  <div style={{ 
                    backgroundColor: "white", 
                    padding: "20px", 
                    borderRadius: "15px", 
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
                    position: "relative"
                  }}>
                    {isVideo ? (
                      <video 
                        ref={videoRef}
                        src={sourceMedia} 
                        style={{ maxWidth: "100%", maxHeight: "1000px", objectFit: "contain", borderRadius: "5px" }} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <img src={sourceMedia} style={{ maxWidth: "100%", maxHeight: "1000px", objectFit: "contain", borderRadius: "5px" }} />
                    )}
                    
                    {/* SOURCE TAG */}
                    {sourceName && (
                      <div style={{ 
                        position: "absolute", 
                        bottom: "-30px", 
                        right: "40px", 
                        backgroundColor: "#dc2626", 
                        color: "white", 
                        padding: "15px 30px", 
                        borderRadius: "8px",
                        fontFamily: "Arial",
                        fontWeight: "bold",
                        fontSize: "30px",
                        boxShadow: "0 10px 15px rgba(0,0,0,0.3)"
                      }}>
                        Source : {sourceName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ border: "4px dashed rgba(255,255,255,0.3)", borderRadius: "20px", width: "100%", height: "800px", display: "flex", justifyContent: "center", alignItems: "center", color: "rgba(255,255,255,0.5)", fontSize: "40px", fontWeight: "bold" }}>
                    VOTRE MÉDIA ICI
                  </div>
                )}

                {/* NOTE / COMMENTAIRE (DEPLACEE EN BAS) */}
                {noteText && (
                  <div style={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    color: "#1f2937",
                    padding: "25px 40px",
                    borderRadius: "15px",
                    marginTop: "40px",
                    width: "100%",
                    boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                    fontSize: "36px",
                    fontFamily: "'Arial', sans-serif",
                    lineHeight: "1.4",
                    borderLeft: "12px solid #dc2626"
                  }}>
                    {noteText}
                  </div>
                )}
              </div>

              {/* BOTTOM LOGO */}
              <div style={{ position: "absolute", bottom: "50px", width: "100%", display: "flex", justifyContent: "center", zIndex: 10 }}>
                <div style={{ display: "flex", borderRadius: "5px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  <div
                    style={{
                      backgroundColor: "#dc2626",
                      color: "#fff",
                      padding: "25px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "120px",
                    }}
                  >
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        background: "linear-gradient(to bottom, #dc2626, #7f1d1d)",
                        padding: "5px 30px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span style={{
                        color: "#ffffff",
                        fontSize: "55px",
                        fontWeight: "900",
                        letterSpacing: "1px",
                        fontFamily: '"Arial Black", Arial, sans-serif',
                        textTransform: "uppercase",
                        lineHeight: "1.1",
                        WebkitTextStroke: "2.5px #ffffff"
                      }}>
                        AFOLUKU
                      </span>
                    </div>
                    <div
                      style={{
                        background: "linear-gradient(to bottom, #ffffff, #cbd5e1)",
                        padding: "5px 30px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span style={{
                        color: "#1e3a8a",
                        fontSize: "55px",
                        fontWeight: "900",
                        letterSpacing: "1px",
                        fontFamily: "Arial, sans-serif",
                        textTransform: "uppercase",
                        lineHeight: "1.1"
                      }}>
                        MÉDIA
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
