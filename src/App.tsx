import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Quiz from './pages/Quiz';
import SanctuaryRouter from './pages/SanctuaryRouter';
import { AiConsentProvider } from './context/AiConsentContext';

export default function App() {
  return (
    <BrowserRouter>
      <AiConsentProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/sanctuary/:type" element={<SanctuaryRouter />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </AiConsentProvider>
    </BrowserRouter>
  );
}
