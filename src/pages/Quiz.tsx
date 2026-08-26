import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QuizQuestion from '../components/Quiz/QuizQuestion';
import QuizProgress from '../components/Quiz/QuizProgress';
import { calculateSanctuary } from '../utils/scoringAlgorithm';

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
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(8).fill(null));
  const [direction, setDirection] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [sanctuary, setSanctuary] = useState<string>('');

  const handleSelect = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = index;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setDirection(1);
        setCurrentQ(q => q + 1);
      } else {
        const result = calculateSanctuary(newAnswers);
        setSanctuary(result);
        setCompleting(true);
        setTimeout(() => {
          localStorage.setItem('solace_sanctuary_type', result);
          navigate(`/sanctuary/${result}`);
        }, 2800);
      }
    }, 350);
  };

  const sanctuaryColors: { [k: string]: string } = {
    studio: '#C4622D',
    library: '#C9A84C',
    garden: '#5C8A5E',
    arcade: '#C084FC',
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: bgColors[currentQ] ?? '#0e0a16' }}
    >
      {/* Completing overlay */}
      <AnimatePresence>
        {completing && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{ backgroundColor: sanctuaryColors[sanctuary] ?? '#fff' }}
              initial={{ width: 0, height: 0, opacity: 0.6 }}
              animate={{ width: '300vw', height: '300vw', opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
            <motion.p
              className="relative z-10 text-white/90 text-2xl sm:text-3xl font-light text-center"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              we found your space.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg px-4 pb-8 pt-24">
        {/* Progress */}
        <div className="mb-12 px-2">
          <QuizProgress total={questions.length} current={currentQ} />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQ}
            custom={direction}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <QuizQuestion
              question={questions[currentQ].question}
              options={questions[currentQ].options}
              selectedIndex={answers[currentQ]}
              onSelect={handleSelect}
              questionIndex={currentQ}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
