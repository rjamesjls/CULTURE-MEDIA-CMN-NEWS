import {PGlite} from '@electric-sql/pglite';
export const postgres=new PGlite();
export const objects=new Map();
export const identity={user:{id:'00000000-0000-4000-8000-000000000001'},profile:{role:'admin',status:'active'}};
