import pg from 'pg';
// These statements are internal application queries; no endpoint accepts SQL.
export function postgresSql(sql){
 let index=0;
 let query=sql.replace(/'(?:''|[^'])*'|\?/g,token=>token==='?'?`$${++index}`:token);
 query=query.replace(/\bMIN\(30000,/g,'LEAST(30000,').replace(/\bIS (\$\d+)/g,'IS NOT DISTINCT FROM $1');
 if(/^INSERT OR IGNORE /i.test(query))query=query.replace(/^INSERT OR IGNORE /i,'INSERT ')+' ON CONFLICT DO NOTHING';
 query=query.replace(/'(?:''|[^'])*'|\b(FROM|JOIN|INTO|UPDATE|TABLE)\s+(tracks|playlists|station|live_sessions|listener_sessions|stream_attempts|track_streams|radio_settings|uploads)\b/gi,(match,command,table)=>command?`${command} afoluku_radio.${table}`:match);
 return query;
}
let pool;
function connection(){
 const url=process.env.RADIO_DATABASE_URL;
 if(!url)throw Object.assign(new Error('La radio doit être configurée dans Supabase et Vercel.'),{radioConfiguration:true});
 if(!pool)pool=new pg.Pool({connectionString:url,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:8000,types:{getTypeParser(oid,format){return oid===20?value=>{const n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Radio integer overflow');return n}:pg.types.getTypeParser(oid,format)}}});
 return pool;
}
class Statement{
 constructor(sql,values=[]){this.sql=postgresSql(sql);this.values=values;}
 bind(...values){this.values=values;return this;}
 async execute(client=connection()){const r=await client.query(this.sql,this.values);return {results:r.rows,meta:{changes:r.rowCount||0}};}
 run(){return this.execute()}
 all(){return this.execute()}
 async first(){return (await this.execute()).results[0]||null}
}
export const radioDatabase={prepare:sql=>new Statement(sql),async batch(statements){return transaction(async client=>{const result=[];for(const statement of statements)result.push(await statement.execute(client));return result})}};
export async function transaction(work){const client=await connection().connect();try{await client.query('BEGIN');const scoped={query:(sql,values)=>client.query(postgresSql(sql),values)};const result=await work(scoped);await client.query('COMMIT');return result}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
