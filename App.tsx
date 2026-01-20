import React, { useState, useEffect } from 'react';
import { MathProblem, TutorState } from './types';
import { generateProblem } from './utils/math';
import { generateProblemContext } from './services/gemini';
import { Tutor } from './components/Tutor';
import { MathWizard } from './components/MathWizard';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(generateProblem());
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
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl space-y-6">
        <Tutor state={tutorState} />
        
        <MathWizard 
          problem={currentProblem}
          tutorState={tutorState}
          setTutorState={setTutorState}
          onNextProblem={handleNextProblem}
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
