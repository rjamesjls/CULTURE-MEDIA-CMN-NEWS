import pg from 'pg';
import {readFile} from 'node:fs/promises';
if(!process.env.RADIO_DATABASE_URL)throw new Error('Définissez RADIO_DATABASE_URL dans votre environnement sécurisé.');
const client=new pg.Client({connectionString:process.env.RADIO_DATABASE_URL});
try{await client.connect();await client.query(await readFile(new URL('../supabase/migrations/20260927120000_afoluku_radio.sql',import.meta.url),'utf8'));console.log('Schéma et stockage AFOLUKU RADIO installés.');}finally{await client.end()}
