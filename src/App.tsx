import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Landing from './pages/Landing';
import Quiz from './pages/Quiz';
import SanctuaryRouter from './pages/SanctuaryRouter';
import Companion from './pages/Companion';
import { AiConsentProvider } from './context/AiConsentContext';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AiConsentProvider>
          <a href="#main" className="skip-link">Skip to content</a>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/companion" element={<Companion />} />
            <Route path="/sanctuary/:type" element={<SanctuaryRouter />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </AiConsentProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
