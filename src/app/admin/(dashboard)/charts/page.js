import YouTubeChartsClient from './YouTubeChartsClient';

export const metadata = {
  title: 'Classements YouTube | A FOLUKU TV',
};

export default function YouTubeChartsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Classements YouTube (Charts)</h1>
        <p className="mt-2 text-sm text-gray-600">
          Suivez les performances des clips vidéos locaux et générez des classements (Top Semaine, Top Mois).
        </p>
      </div>

      <YouTubeChartsClient />
    </div>
  );
}
