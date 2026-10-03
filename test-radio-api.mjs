import fetch from 'node-fetch';
const res = await fetch('http://localhost:3000/api/afoluku-radio/station', {
  headers: {
    'cookie': 'cookie-placeholder' // if needed, but the radio API might need admin auth...
  }
});
const text = await res.text();
console.log(res.status, text);
