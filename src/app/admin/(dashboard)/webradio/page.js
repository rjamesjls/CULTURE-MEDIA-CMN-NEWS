import {redirect} from 'next/navigation';
import {admin,ApiError} from '@/lib/afoluku-radio/server';
import Studio from '@/components/afoluku-radio/studio';
import '@/components/afoluku-radio/radio.css';
export const metadata={title:'Régie AFOLUKU RADIO | AFOLUKU TV',robots:{index:false,follow:false}};
export default async function WebradioPage(){
 try{await admin()}catch(error){if(error instanceof ApiError&&error.status===401)redirect('/admin/login?next=%2Fadmin%2Fwebradio');if(error instanceof ApiError&&error.status===403)return <p role="alert">La régie est réservée aux administrateurs actifs.</p>;throw error;}
 return <div className="afoluku-radio-app"><Studio/></div>;
}
