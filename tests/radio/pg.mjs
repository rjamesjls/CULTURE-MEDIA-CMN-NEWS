import {postgres} from './runtime.mjs';
class Pool{async query(sql,values){const r=await postgres.query(sql,values);return {rows:r.rows,rowCount:r.affectedRows??r.rows.length}}async connect(){return {query:this.query,release(){}}}}
export default {Pool,types:{getTypeParser:()=>value=>value}};
