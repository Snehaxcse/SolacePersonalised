import { useParams, Navigate } from 'react-router-dom';
import StudioSanctuary from '../components/Sanctuaries/Studio/StudioSanctuary';
import LibrarySanctuary from '../components/Sanctuaries/Library/LibrarySanctuary';
import GardenSanctuary from '../components/Sanctuaries/Garden/GardenSanctuary';
import ArcadeSanctuary from '../components/Sanctuaries/Arcade/ArcadeSanctuary';
import SanctuaryErrorBoundary from '../components/shared/SanctuaryErrorBoundary';

export default function SanctuaryRouter() {
  const { type } = useParams<{ type: string }>();

  let room = null;
  if (type === 'studio') room = <StudioSanctuary />;
  else if (type === 'library') room = <LibrarySanctuary />;
  else if (type === 'garden') room = <GardenSanctuary />;
  else if (type === 'arcade') room = <ArcadeSanctuary />;
  else return <Navigate to="/" replace />;

  return <SanctuaryErrorBoundary>{room}</SanctuaryErrorBoundary>;
}
