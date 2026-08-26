import { motion } from 'framer-motion';

interface Option {
  label: string;
}

interface Props {
  question: string;
  options: Option[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  questionIndex: number;
  totalQuestions: number;
}

const WeatherIcons: { [key: string]: React.ReactNode } = {
  'Stormy': (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-hidden="true">
      <ellipse cx="20" cy="18" rx="10" ry="7" fill="currentColor" opacity="0.6" />
      <ellipse cx="28" cy="15" rx="7" ry="5" fill="currentColor" opacity="0.5" />
      <line x1="14" y1="27" x2="12" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="27" x2="16" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="27" x2="20" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'Cloudy': (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-hidden="true">
      <ellipse cx="18" cy="20" rx="10" ry="7" fill="currentColor" opacity="0.5" />
      <ellipse cx="26" cy="17" rx="8" ry="6" fill="currentColor" opacity="0.6" />
      <ellipse cx="13" cy="22" rx="6" ry="5" fill="currentColor" opacity="0.4" />
    </svg>
  ),
  'Partly Sunny': (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-hidden="true">
      <circle cx="27" cy="13" r="6" fill="currentColor" opacity="0.7" />
      <line x1="27" y1="5" x2="27" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="34" y1="13" x2="36" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="18" cy="23" rx="10" ry="7" fill="currentColor" opacity="0.5" />
      <ellipse cx="26" cy="20" rx="7" ry="5" fill="currentColor" opacity="0.4" />
    </svg>
  ),
  'Clear': (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-hidden="true">
      <circle cx="20" cy="20" r="7" fill="currentColor" opacity="0.8" />
      <line x1="20" y1="9" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="31" x2="20" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="9" y1="20" x2="6" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="31" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="12" y1="12" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="28" y1="12" x2="30" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="12" y1="28" x2="10" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="28" y1="28" x2="30" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
};

export default function QuizQuestion({ question, options, selectedIndex, onSelect, questionIndex, totalQuestions }: Props) {
  const isWeatherQuestion = questionIndex === 0;
  const headingId = 'quiz-question';
  const groupId = 'quiz-options';

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-6">
      <motion.h1
        id={headingId}
        tabIndex={-1}
        key={question}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl sm:text-3xl font-light text-white text-center mb-4 leading-relaxed outline-none"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300 }}
      >
        {question}
      </motion.h1>
      <p className="sr-only" id={groupId}>
        Question {questionIndex + 1} of {totalQuestions}. Choose one answer, then continue.
      </p>

      <div
        role="radiogroup"
        aria-labelledby={headingId}
        aria-describedby={groupId}
        className={`grid gap-3 w-full ${isWeatherQuestion ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        {options.map((option, i) => {
          const isSelected = selectedIndex === i;
          return (
            <motion.button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              onClick={() => onSelect(i)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-2xl p-4 text-left border transition-all duration-300 ${
                isSelected
                  ? 'border-white/70 bg-white/15 shadow-lg'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              {isWeatherQuestion && WeatherIcons[option.label] && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className={`transition-colors duration-300 ${isSelected ? 'text-white' : 'text-white/80'}`}>
                    {WeatherIcons[option.label]}
                  </div>
                  <span className={`text-sm font-light transition-colors duration-300 ${isSelected ? 'text-white' : 'text-white/80'}`}>
                    {option.label}
                  </span>
                </div>
              )}
              {!isWeatherQuestion && (
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                    isSelected ? 'border-white bg-white' : 'border-white/50'
                  }`} aria-hidden="true">
                    {isSelected && (
                      <svg viewBox="0 0 8 8" fill="none" className="w-2 h-2">
                        <path d="M1 4l2 2 4-4" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm sm:text-base font-light transition-colors duration-300 ${isSelected ? 'text-white' : 'text-white/85'}`}>
                    {option.label}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
