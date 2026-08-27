import SanctuaryHeader from '../components/shared/SanctuaryHeader';
import CompanionExperience from '../components/Companion/CompanionExperience';
import SanctuaryErrorBoundary from '../components/shared/SanctuaryErrorBoundary';

export default function Companion() {
  return (
    <SanctuaryErrorBoundary>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#121018' }}>
        <SanctuaryHeader textColor="text-[#F5ECD7]" />
        <main id="main" className="flex-1 flex flex-col">
          <CompanionExperience />
        </main>
      </div>
    </SanctuaryErrorBoundary>
  );
}
