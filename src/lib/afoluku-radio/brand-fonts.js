let ready;
// Load actual local font files before rasterizing text into a downloadable video.
export function loadPortraitFonts() {
 if (!ready) ready = Promise.all([
  ['Afoluku Anton','/afoluku-radio/fonts/Anton-Regular.ttf','400'],
  ['Afoluku Montserrat','/assets/fonts/Montserrat-Black.ttf','900'],
  ['Afoluku Poppins','/afoluku-radio/fonts/Poppins-Light.ttf','300'],
  ['Afoluku Poppins','/afoluku-radio/fonts/Poppins-Bold.ttf','700'],
 ].map(async ([family,url,weight])=>{
  const face=new FontFace(family,`url("${url}")`,{weight});
  await face.load();document.fonts.add(face);
 })).catch(()=>{ready=undefined;throw new Error('Les polices de la radio ne sont pas disponibles. Réessayez l’export.');});
 return ready;
}
