import Listener from '@/components/afoluku-radio/player';
import '@/components/afoluku-radio/radio.css';
export const metadata={title:'AFOLUKU RADIO — Le direct',description:'Écoutez AFOLUKU RADIO et retrouvez la musique et les émissions en direct d’AFOLUKU TV.'};
export default function RadioPage(){return <div className="afoluku-radio-app"><Listener/></div>}
