const TOKEN = process.env.META_ACCESS_TOKEN;

async function check() {
  console.log("Checking token permissions...");
  const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${TOKEN}`);
  const permData = await permRes.json();
  console.log("Permissions:", permData);
}
check();
