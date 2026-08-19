"use server";

import { createClient } from "@supabase/supabase-js";

// On utilise le service role key si disponible pour contourner RLS sur le bucket media (comme l'admin)
// Ou sinon l'anon key par défaut.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function publishToMeta(formData) {
  try {
    const base64Image1 = formData.get('base64Image1');
    const base64Image2 = formData.get('base64Image2');
    const caption = formData.get('caption');
    const instagramTags = formData.get('instagramTags');
    const articleId = formData.get('articleId');
    const facebookPageId = process.env.FACEBOOK_PAGE_ID;
    const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    const targetsStr = formData.get('targets') || '["facebook", "instagram"]';
    const targets = JSON.parse(targetsStr);

    if (!facebookPageId || !instagramAccountId || !accessToken || !base64Image1 || !base64Image2) {
      return { 
        success: false, 
        error: "Configuration Meta manquante ou images manquantes." 
      };
    }

    // Format instagramTags for Meta API
    let formattedUserTags = null;
    if (instagramTags && instagramTags.trim() !== '') {
      const tagsList = instagramTags.split(',').map(t => t.trim().replace('@', '')).filter(t => t.length > 0);
      if (tagsList.length > 0) {
        // Tag all users in the center of the image (x: 0.5, y: 0.5)
        const tagsObj = tagsList.map(username => ({ username, x: 0.5, y: 0.5 }));
        formattedUserTags = JSON.stringify(tagsObj);
      }
    }

    // Fonction utilitaire pour uploader sur Supabase
    const uploadToSupabase = async (base64, index) => {
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `meta_upload_${Date.now()}_${index}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(`social_posts/${fileName}`, buffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(`social_posts/${fileName}`);
      
      return publicUrlData.publicUrl;
    };

    const publicUrl1 = await uploadToSupabase(base64Image1, 1);
    const publicUrl2 = await uploadToSupabase(base64Image2, 2);

    // Wait 2 seconds for Supabase CDN to propagate the files so Meta can download them
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ------------------------------------------
    // 2. Publier sur Facebook (Multi-images)
    // ------------------------------------------
    let fbSuccess = false;
    let fbPostId = null;
    let fbError = null;
    
    if (targets.includes('facebook')) {
      try {
      // Étape FB 1 : Uploader les deux images en tant que "unpublished"
      const uploadFbPhoto = async (url) => {
        const res = await fetch(`https://graph.facebook.com/v19.0/${facebookPageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url,
            published: false,
            access_token: accessToken
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.id;
      };

      const fbPhotoId1 = await uploadFbPhoto(publicUrl1);
      const fbPhotoId2 = await uploadFbPhoto(publicUrl2);

      // Étape FB 2 : Créer le post avec les médias attachés
      const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${facebookPageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: caption,
          attached_media: [{ media_fbid: fbPhotoId1 }, { media_fbid: fbPhotoId2 }],
          access_token: accessToken
        })
      });
      
      const fbData = await fbResponse.json();
      if (fbData.error) {
        throw new Error(fbData.error.message);
      } else {
        fbSuccess = true;
        fbPostId = fbData.id;
      }
      } catch (e) {
        fbError = e.message;
        console.error("Erreur FB Multi-image:", e);
      }
    } else {
      fbSuccess = true; // Ignored implies success for overall logic
    }

    // ------------------------------------------
    // 3. Publier sur Instagram (Carrousel)
    // ------------------------------------------
    let igSuccess = false;
    let igPostId = null;
    let igError = null;
    
    if (targets.includes('instagram')) {
      try {
      // Étape IG 1 : Créer les Item Containers
      const createIgItemContainer = async (url) => {
        const reqBody = {
          image_url: url,
          is_carousel_item: true,
          access_token: accessToken
        };

        if (formattedUserTags) {
          reqBody.user_tags = formattedUserTags;
        }

        const res = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.id;
      };

      const igItemId1 = await createIgItemContainer(publicUrl1);
      const igItemId2 = await createIgItemContainer(publicUrl2);

      // Étape IG 2 : Attendre que les items soient FINISHED
      const pollIgContainer = async (id) => {
        let isReady = false;
        let attempts = 0;
        while (!isReady && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const res = await fetch(`https://graph.facebook.com/v19.0/${id}?fields=status_code&access_token=${accessToken}`);
          const data = await res.json();
          if (data.status_code === 'FINISHED') isReady = true;
          else if (data.status_code === 'ERROR') throw new Error(`Erreur traitement item ${id}`);
          attempts++;
        }
        if (!isReady) throw new Error(`Timeout pour l'item ${id}`);
      };

      await pollIgContainer(igItemId1);
      await pollIgContainer(igItemId2);

      // Étape IG 3 : Créer le Carousel Container
      const carouselRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: `${igItemId1},${igItemId2}`,
          caption: caption,
          access_token: accessToken
        })
      });
      const carouselData = await carouselRes.json();
      if (carouselData.error) throw new Error(carouselData.error.message);
      const carouselId = carouselData.id;

      // Attendre que le carousel soit FINISHED
      await pollIgContainer(carouselId);

      // Étape IG 4 : Publier le Carousel
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: carouselId,
          access_token: accessToken
        })
      });
      const publishData = await publishRes.json();
      if (publishData.error) throw new Error(publishData.error.message);
      
      igSuccess = true;
      igPostId = publishData.id;
      } catch (e) {
        igError = e.message;
        console.error("Erreur IG Carousel:", e);
      }
    } else {
      igSuccess = true;
    }

    // Determine overall success
    const overallSuccess = fbSuccess || igSuccess;
    let combinedError = "";
    if (!fbSuccess) combinedError += `Erreur Facebook: ${fbError}. `;
    if (!igSuccess) combinedError += `Erreur Instagram: ${igError}.`;

    if (overallSuccess && articleId) {
      const { error: dbError } = await supabase
        .from('articles')
        .update({
          facebook_post_id: fbPostId || null,
          instagram_post_id: igPostId || null
        })
        .eq('id', articleId);
        
      if (dbError) {
        console.error("Erreur lors de la sauvegarde des IDs Meta dans Supabase:", dbError);
      }
    }

    return { 
      success: overallSuccess, 
      partial: !fbSuccess || !igSuccess,
      error: !overallSuccess ? combinedError : combinedError,
      facebook_post_id: fbPostId,
      instagram_post_id: igPostId
    };

  } catch (err) {
    console.error("Erreur générale publication Meta:", err);
    return { success: false, error: err.message || "Une erreur inconnue s'est produite." };
  }
}
