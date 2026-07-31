const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const content = `
<h2>Envoyez-nous vos infos et vos actualités</h2>

<p><em>Vous avez une actualité, vous êtes témoins d’un événement, vous organisez un dîner caritatif, publiez une musique, publiez un livre, avez remporté un concours, recruté un nouveau responsable, vous venez d’être intronisé dans une association, en conférence, en démonstration, etc.</em></p>
<p><em>Merci de m’envoyer l’information par mail à <strong>info@culturemedianews.fr</strong> si vous souhaitez la voir publiée gratuitement sur Culture Média News !</em></p>
<p><em>Sur les réseaux sociaux, pour m’informer de vos publications, vous pouvez m’identifier pour que je sois alertée.</em></p>
<p><em>@culturemediacmn</em></p>

<h3>Informer ou communiquer ?</h3>

<p>Quelle est la différence ? L’information est gratuite car elle relève d’une actualité non commerciale.</p>
<p>De ce fait, les sujets que je retiendrais portent sur les ouvertures, les sortie de musiques, les nouveaux singles, les concours, les événements, les livres ou encore les concepts nouveaux mis en place dans vos établissements.</p>
<p>Pour les sujets considérés comme de la communication/ publicité, ils sont réservés aux partenaires/annonceurs ! <a href="http://www.studiojls.com" target="_blank">Toutes les infos ici.</a></p>
  `;

  const { data, error } = await supabase.from('pages').insert({
    title: 'Nous contacter',
    slug: 'contact',
    content: content,
    status: 'published'
  });

  if (error) {
    console.error('Error inserting page:', error);
  } else {
    console.log('Page inserted successfully:', data);
  }
}

main();
