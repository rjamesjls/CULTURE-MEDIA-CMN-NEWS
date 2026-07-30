const cleanHtmlForDisplay = (html) => {
  if (!html) return '';
  let cleaned = html.replace(/<\/p>\s*<p[^>]*>/g, '<br/>');
  cleaned = cleaned.replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '');
  return cleaned;
};
console.log(cleanHtmlForDisplay("<p>H</p>"));
console.log(cleanHtmlForDisplay("<p>Hello</p><p>World</p>"));
console.log(cleanHtmlForDisplay("<p><span style=\"color: red;\">Text</span></p>"));
