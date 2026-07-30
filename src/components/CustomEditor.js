"use client";

import React, { useMemo, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// Configure Size
const Size = Quill.import("attributors/style/size");
Size.whitelist = [
  "10px", "12px", "14px", "16px", "18px", "20px", "24px", 
  "30px", "36px", "48px", "60px", "72px", "84px", "96px"
];
Quill.register(Size, true);

// Configure Font Weight
const Parchment = Quill.import("parchment");
const StyleAttributor = Size.constructor;
const FontWeightStyle = new StyleAttributor("font-weight", "font-weight", {
  scope: Parchment.Scope.INLINE,
  whitelist: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
Quill.register(FontWeightStyle, true);

// Configure Custom Icons so they actually appear in the toolbar
const icons = Quill.import("ui/icons");
icons.customColor = `<span style="font-size:12px; font-weight:bold; color:#ef4444;">Texte🎨</span>`;
icons.customBgColor = `<span style="font-size:12px; font-weight:bold; color:#854d0e;">Fond🎨</span>`;

export default function CustomEditor({ value, onChange, style, className }) {
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, 4, false] }],
          [{ size: Size.whitelist }],
          [{ "font-weight": FontWeightStyle.whitelist }],
          ["bold", "italic", "underline", "strike"],
          ["customColor", "customBgColor"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "blockquote"],
          ["clean"],
        ],
        handlers: {
          customColor: function () {
            const input = document.createElement("input");
            input.setAttribute("type", "color");
            input.value = "#000000"; 
            input.style.display = "none";
            document.body.appendChild(input);
            
            input.addEventListener("input", (e) => {
              this.quill.format("color", e.target.value);
            });
            
            input.addEventListener("change", () => {
              document.body.removeChild(input);
            });

            input.click();
          },
          customBgColor: function () {
            const input = document.createElement("input");
            input.setAttribute("type", "color");
            input.value = "#ffffff";
            input.style.display = "none";
            document.body.appendChild(input);
            
            input.addEventListener("input", (e) => {
              this.quill.format("background", e.target.value);
            });
            
            input.addEventListener("change", () => {
              document.body.removeChild(input);
            });

            input.click();
          },
        },
      },
    }),
    []
  );

  useEffect(() => {
    // Injecting CSS dynamically for the custom toolbar elements
    const styleId = 'custom-quill-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        .ql-font-weight .ql-picker-label::before { content: 'Graisse' !important; }
        .ql-font-weight .ql-picker-item[data-value="100"]::before { content: '100 - Fin' !important; font-weight: 100; }
        .ql-font-weight .ql-picker-item[data-value="200"]::before { content: '200' !important; font-weight: 200; }
        .ql-font-weight .ql-picker-item[data-value="300"]::before { content: '300 - Léger' !important; font-weight: 300; }
        .ql-font-weight .ql-picker-item[data-value="400"]::before { content: '400 - Normal' !important; font-weight: 400; }
        .ql-font-weight .ql-picker-item[data-value="500"]::before { content: '500 - Moyen' !important; font-weight: 500; }
        .ql-font-weight .ql-picker-item[data-value="600"]::before { content: '600 - Semi' !important; font-weight: 600; }
        .ql-font-weight .ql-picker-item[data-value="700"]::before { content: '700 - Gras' !important; font-weight: 700; }
        .ql-font-weight .ql-picker-item[data-value="800"]::before { content: '800' !important; font-weight: 800; }
        .ql-font-weight .ql-picker-item[data-value="900"]::before { content: '900 - Noir' !important; font-weight: 900; }
        
        .ql-size .ql-picker-label::before { content: 'Taille' !important; }
        .ql-size .ql-picker-item[data-value="10px"]::before { content: '10px' !important; font-size: 10px !important; }
        .ql-size .ql-picker-item[data-value="12px"]::before { content: '12px' !important; font-size: 12px !important; }
        .ql-size .ql-picker-item[data-value="14px"]::before { content: '14px' !important; font-size: 14px !important; }
        .ql-size .ql-picker-item[data-value="16px"]::before { content: '16px' !important; font-size: 16px !important; }
        .ql-size .ql-picker-item[data-value="18px"]::before { content: '18px' !important; font-size: 18px !important; }
        .ql-size .ql-picker-item[data-value="20px"]::before { content: '20px' !important; font-size: 20px !important; }
        .ql-size .ql-picker-item[data-value="24px"]::before { content: '24px' !important; font-size: 24px !important; }
        .ql-size .ql-picker-item[data-value="30px"]::before { content: '30px' !important; font-size: 30px !important; }
        .ql-size .ql-picker-item[data-value="36px"]::before { content: '36px' !important; font-size: 36px !important; }
        .ql-size .ql-picker-item[data-value="48px"]::before { content: '48px' !important; font-size: 48px !important; }
        .ql-size .ql-picker-item[data-value="60px"]::before { content: '60px' !important; font-size: 60px !important; }
        .ql-size .ql-picker-item[data-value="72px"]::before { content: '72px' !important; font-size: 72px !important; }
        .ql-size .ql-picker-item[data-value="84px"]::before { content: '84px' !important; font-size: 84px !important; }
        .ql-size .ql-picker-item[data-value="96px"]::before { content: '96px' !important; font-size: 96px !important; }

        .ql-snow .ql-toolbar button.ql-customColor {
          width: auto !important;
          padding: 0 8px !important;
          background-color: #f3f4f6 !important;
          border-radius: 4px;
          margin-right: 4px;
        }
        .ql-snow .ql-toolbar button.ql-customColor:hover {
          background-color: #e5e7eb !important;
        }
        
        .ql-snow .ql-toolbar button.ql-customBgColor {
          width: auto !important;
          padding: 0 8px !important;
          background-color: #fef08a !important;
          border-radius: 4px;
        }
        .ql-snow .ql-toolbar button.ql-customBgColor:hover {
          background-color: #fde047 !important;
        }
        
        /* Permettre à la dropdown Taille et Graisse d'être plus large */
        .ql-snow .ql-picker.ql-size {
          width: 60px;
        }
        .ql-snow .ql-picker.ql-font-weight {
          width: 80px;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  return (
    <div className={`custom-quill-editor ${className || ''}`} style={style}>
      <ReactQuill theme="snow" value={value || ""} onChange={onChange} modules={modules} style={{height: '100%'}}/>
    </div>
  );
}
