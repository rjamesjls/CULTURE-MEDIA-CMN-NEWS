import {redirect} from 'next/navigation';
import {admin,ApiError} from '@/lib/afoluku-radio/server';
import InterviewStudio from '@/components/interviews/studio';
import '@/components/interviews/interviews.css';
export const dynamic='force-dynamic';
export const metadata={title:'Interviews vidéo | AFOLUKU TV',robots:{index:false,follow:false}};
export default async function Page(){try{await admin()}catch(error){if(error instanceof ApiError&&error.status===401)redirect('/admin/login?next=%2Fadmin%2Finterviews%2Fvideo');if(error instanceof ApiError&&error.status===403)return <p role="alert">Les interviews sont réservées aux administrateurs actifs.</p>;throw error;}return <InterviewStudio/>;}
