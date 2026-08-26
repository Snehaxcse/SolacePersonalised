import { useParams, Navigate } from 'react-router-dom';
import StudioSanctuary from '../components/Sanctuaries/Studio/StudioSanctuary';
import LibrarySanctuary from '../components/Sanctuaries/Library/LibrarySanctuary';
import GardenSanctuary from '../components/Sanctuaries/Garden/GardenSanctuary';
import ArcadeSanctuary from '../components/Sanctuaries/Arcade/ArcadeSanctuary';

export default function SanctuaryRouter() {
  const { type } = useParams<{ type: string }>();

  if (type === 'studio') return <StudioSanctuary />;
  if (type === 'library') return <LibrarySanctuary />;
  if (type === 'garden') return <GardenSanctuary />;
  if (type === 'arcade') return <ArcadeSanctuary />;
  return <Navigate to="/" replace />;
}
