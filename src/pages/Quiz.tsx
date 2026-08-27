import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QuizQuestion from '../components/Quiz/QuizQuestion';
import QuizProgress from '../components/Quiz/QuizProgress';
import { calculateSanctuary } from '../utils/scoringAlgorithm';
import { saveQuizWeatherFromAnswers, saveSuggestedSanctuary } from '../utils/solaceMemory';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const questions = [
  {
    question: 'How are you feeling right now?',
    options: [
      { label: 'Stormy' },
      { label: 'Cloudy' },
      { label: 'Partly Sunny' },
      { label: 'Clear' },
    ],
  },
  {
    question: 'What does calm feel like to you?',
    options: [
      { label: 'Silence and stillness' },
      { label: 'Gentle background noise' },
      { label: 'Creating something' },
      { label: 'Moving my body' },
    ],
  },
  {
    question: 'What do you naturally reach for when overwhelmed?',
    options: [
      { label: 'Music' },
      { label: 'Drawing or writing' },
      { label: 'Reading' },
      { label: 'Talking to someone' },
      { label: 'Just need quiet' },
    ],
  },
  {
    question: 'How does your mind work at its best?',
    options: [
      { label: 'Focused on one thing' },
      { label: 'Jumping between ideas' },
      { label: 'Working with my hands' },
      { label: 'Listening and absorbing' },
    ],
  },
  {
    question: 'What kind of space feels safest?',
    options: [
      { label: 'Cozy and enclosed' },
      { label: 'Open and airy' },
      { label: 'Somewhere with nature' },
      { label: 'Anywhere I can create' },
    ],
  },
  {
    question: 'When something is bothering you, you prefer to:',
    options: [
      { label: 'Sit with it quietly' },
      { label: 'Express it creatively' },
      { label: 'Talk it through' },
      { label: 'Distract yourself gently' },
    ],
  },
  {
    question: 'What brings you the most joy?',
    options: [
      { label: 'Making something beautiful' },
      { label: 'Solving a problem' },
      { label: 'Connecting with others' },
      { label: 'Learning something new' },
    ],
  },
  {
    question: 'Right now, what do you need most?',
    options: [
      { label: 'To create' },
      { label: 'To breathe' },
      { label: 'To focus' },
      { label: 'To just exist for a moment' },
    ],
  },
];

const bgColors = [
  '#0e0a16',
  '#0a0e16',
  '#0a1210',
  '#100a16',
  '#0a1410',
  '#120e0a',
  '#0a0e14',
  '#0e100a',
];

export default function Quiz() {
  const navigate = useNavigate();
  const reduceMotion = usePrefersReducedMotion();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(8).fill(null));
  const [direction, setDirection] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [sanctuary, setSanctuary] = useState<string>('');
  const firstQuestion = useRef(true);

  useEffect(() => {
    if (firstQuestion.current) {
      firstQuestion.current = false;
      return;
    }
    document.getElementById('quiz-question')?.focus();
  }, [currentQ]);

  const handleSelect = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = index;
    setAnswers(newAnswers);
  };

  const goNext = () => {
    if (answers[currentQ] === null) return;
    if (currentQ < questions.length - 1) {
      setDirection(1);
      setCurrentQ(q => q + 1);
      return;
    }
    const result = calculateSanctuary(answers);
    setSanctuary(result);
    setCompleting(true);
    const delay = reduceMotion ? 400 : 2800;
    setTimeout(() => {
      saveSuggestedSanctuary(result);
      saveQuizWeatherFromAnswers(answers);
      navigate(`/sanctuary/${result}`);
    }, delay);
  };

  const sanctuaryColors: { [k: string]: string } = {
    studio: '#C4622D',
    library: '#C9A84C',
    garden: '#5C8A5E',
    arcade: '#C084FC',
  };

  return (
    <main
      id="main"
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: bgColors[currentQ] ?? '#0e0a16' }}
    >
      <AnimatePresence>
        {completing && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.5 }}
            role="status"
            aria-live="polite"
          >
            {!reduceMotion && (
              <motion.div
                className="absolute rounded-full"
                style={{ backgroundColor: sanctuaryColors[sanctuary] ?? '#fff' }}
                initial={{ width: 0, height: 0, opacity: 0.6 }}
                animate={{ width: '300vw', height: '300vw', opacity: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            )}
            {reduceMotion && (
              <div className="absolute inset-0" style={{ backgroundColor: sanctuaryColors[sanctuary] ?? '#fff' }} />
            )}
            <motion.p
              className="relative z-10 text-white text-2xl sm:text-3xl font-light text-center"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300 }}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.8, duration: reduceMotion ? 0.2 : 0.8 }}
            >
              this might feel right today.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg px-4 pb-8 pt-24">
        <div className="mb-12 px-2">
          <QuizProgress total={questions.length} current={currentQ} />
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ}
            custom={direction}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -40 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: 'easeInOut' }}
          >
            <QuizQuestion
              question={questions[currentQ].question}
              options={questions[currentQ].options}
              selectedIndex={answers[currentQ]}
              onSelect={handleSelect}
              questionIndex={currentQ}
              totalQuestions={questions.length}
            />
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={goNext}
            disabled={answers[currentQ] === null || completing}
            className="min-h-11 px-10 py-3 rounded-full border border-white/30 text-white text-sm font-light tracking-widest uppercase hover:border-white/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentQ === questions.length - 1 ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>
    </main>
  );
}
