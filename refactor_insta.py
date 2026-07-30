import re

with open('src/app/admin/(dashboard)/articles/[id]/instagram/InstagramGenerator.js', 'r') as f:
    content = f.read()

# Replace function signatures
for i in range(1, 6):
    content = content.replace(f"const renderTemplate{i} = () => (", f"const renderTemplate{i} = (lang, ref) => (")

# Replace ref={postRef} with ref={ref}
content = content.replace('ref={postRef}', 'ref={ref}')

# Replace currentData.title with currentData[`title_${lang}`]
# Careful, some are inside cleanHtmlForDisplay(currentData.title)
content = content.replace('currentData.title', 'currentData[`title_${lang}`]')
content = content.replace('currentData.body', 'currentData[`body_${lang}`]')
content = content.replace('currentData.category', 'currentData[`category_${lang}`]')

# Write back to a temp file
with open('src/app/admin/(dashboard)/articles/[id]/instagram/InstagramGenerator_refactored.js', 'w') as f:
    f.write(content)
