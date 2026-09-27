import {db,handle,id,ApiError} from '@/lib/afoluku-radio/server';
import {mediaRedirect} from '@/lib/afoluku-radio/storage';
export async function GET(req,{params}){return handle(async()=>{const trackId=id((await params).id);if(!await db().prepare('SELECT id FROM tracks WHERE id=?').bind(trackId).first())throw new ApiError(404,'Titre introuvouvable.');return mediaRedirect('tracks/'+trackId)});}
