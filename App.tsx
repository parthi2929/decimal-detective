import React, { useState, useEffect } from 'react';
import { MathProblem, TutorState } from './types';
import { generateProblem } from './utils/math';
import { generateProblemContext } from './services/gemini';
import { Tutor } from './components/Tutor';
import { MathWizard } from './components/MathWizard';
import { BookOpen, Trophy, RotateCcw } from 'lucide-react';

const SCORE_STORAGE_KEY = 'decimal-detective-score';

const App: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(generateProblem());
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem(SCORE_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [tutorState, setTutorState] = useState<TutorState>({
    message: "Hi! I'm Professor Hoot. Let's solve some decimal mysteries together!",
    emotion: 'happy',
    isLoading: true
  });

  // Initialize new problem
  const initProblem = async (problem: MathProblem) => {
    setTutorState({ 
      message: "Loading our next adventure...", 
      emotion: 'thinking', 
      isLoading: true 
    });
    
    const story = await generateProblemContext(problem.num1, problem.num2);
    
    setTutorState({
      message: story,
      emotion: 'happy',
      isLoading: false
    });
  };

  useEffect(() => {
    initProblem(currentProblem);
  }, [currentProblem.id]);

  const handleNextProblem = () => {
    const newProb = generateProblem();
    setCurrentProblem(newProb);
  };

  const incrementScore = () => {
    setScore(prev => {
      const newScore = prev + 1;
      localStorage.setItem(SCORE_STORAGE_KEY, newScore.toString());
      return newScore;
    });
  };

  const resetScore = () => {
    setScore(0);
    localStorage.setItem(SCORE_STORAGE_KEY, '0');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
             <BookOpen />
          </div>
          <h1 className="text-2xl font-black text-slate-700 tracking-tight">Decimal Detective</h1>
        </div>
        
        {/* Scorecard */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-xl border-2 border-yellow-200 shadow-md">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="font-bold text-slate-700 text-lg">{score}</span>
          <button
            onClick={resetScore}
            className="ml-2 p-1.5 hover:bg-white rounded-lg transition-colors group"
            title="Reset Score"
          >
            <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl space-y-6">
        <Tutor state={tutorState} />
        
        <MathWizard 
          problem={currentProblem}
          tutorState={tutorState}
          setTutorState={setTutorState}
          onNextProblem={handleNextProblem}
          onScoreIncrement={incrementScore}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-400 text-sm font-medium">
        Powered by React & Gemini AI • Learning is Fun!
      </footer>
    </div>
  );
};

export default App;
