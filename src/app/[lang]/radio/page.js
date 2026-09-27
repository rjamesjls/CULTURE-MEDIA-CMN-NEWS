import Listener from '@/components/afoluku-radio/player';
import BottomNav from '@/components/afoluku-radio/BottomNav';
import '@/components/afoluku-radio/radio.css';
export const metadata={title:'AFOLUKU RADIO — Le direct',description:'Écoutez AFOLUKU RADIO et retrouvez la musique et les émissions en direct d’AFOLUKU TV.'};
export default async function RadioPage({ params }) {
  const { lang } = await params;
  return (
    <div className="afoluku-radio-app">
      <Listener/>
      <BottomNav lang={lang} />
    </div>
  );
}
