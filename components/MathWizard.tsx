import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathProblem, WizardStep, TutorState } from '../types';
import { countDecimalPlaces, removeDecimals } from '../utils/math';
import { Button, Card, NumberBadge } from './UI';
import { Check, RefreshCcw, MoveLeft, MoveRight, ArrowDown } from 'lucide-react';
import { getTutorHelp, getCelebrationMessage } from '../services/gemini';
import confetti from 'canvas-confetti';

interface MathWizardProps {
  problem: MathProblem;
  tutorState: TutorState;
  setTutorState: React.Dispatch<React.SetStateAction<TutorState>>;
  onNextProblem: () => void;
  onScoreIncrement: () => void;
}

const STEP_ORDER = {
  [WizardStep.INTRO]: 0,
  [WizardStep.HIDE_DECIMALS]: 1,
  [WizardStep.MULTIPLY]: 2,
  [WizardStep.COUNT_DECIMALS]: 3,
  [WizardStep.PLACE_DECIMAL]: 4,
  [WizardStep.SUCCESS]: 5,
};

export const MathWizard: React.FC<MathWizardProps> = ({ problem, tutorState, setTutorState, onNextProblem, onScoreIncrement }) => {
  const [step, setStep] = useState<WizardStep>(WizardStep.INTRO);
  
  // Inputs
  const [inputStep1, setInputStep1] = useState({ v1: '', v2: '' });
  const [inputStep2, setInputStep2] = useState(''); // Simple multiplication input
  const [inputStep3, setInputStep3] = useState(''); // Counting decimals
  const [decimalPosition, setDecimalPosition] = useState(0); 

  // Column Multiplication State
  const [colMulStep, setColMulStep] = useState(0); // 0: ones, 1: tens
  const [colMulInputs, setColMulInputs] = useState({ ones: '', tens: '' });
  
  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);

  // Derived Math Values
  const int1 = removeDecimals(problem.num1);
  const int2 = removeDecimals(problem.num2);
  const intProduct = int1 * int2;
  const totalDecimals = countDecimalPlaces(problem.num1) + countDecimalPlaces(problem.num2);
  const currentStepIndex = STEP_ORDER[step];

  // Auto scroll
  useEffect(() => {
    if (bottomRef.current && step !== WizardStep.INTRO) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    }
  }, [step, colMulStep]); // Added colMulStep to scroll during sub-steps

  // Reset
  useEffect(() => {
    setStep(WizardStep.INTRO);
    setInputStep1({ v1: '', v2: '' });
    setInputStep2('');
    setInputStep3('');
    setDecimalPosition(0);
    setColMulStep(0);
    setColMulInputs({ ones: '', tens: '' });
  }, [problem]);

  // --- Handlers ---

  const handleStart = () => {
    if (totalDecimals === 0) {
      // SKIP STEP 1 if no decimals
      setStep(WizardStep.MULTIPLY);
      setTutorState({ 
        message: "Since there are no decimals in this problem, we can skip Step 1 and go straight to multiplying!", 
        emotion: 'happy', 
        isLoading: false 
      });
    } else {
      setStep(WizardStep.HIDE_DECIMALS);
      setTutorState({ 
        message: "Step 1: To make this easier, let's rewrite the problem without any dots. Can you type the whole numbers below?", 
        emotion: 'thinking', 
        isLoading: false 
      });
    }
  };

  const checkStep1 = () => {
    const v1 = parseInt(inputStep1.v1);
    const v2 = parseInt(inputStep1.v2);
    
    if (v1 === int1 && v2 === int2) {
      setStep(WizardStep.MULTIPLY);
      setTutorState({
        message: `Perfect! Now we just multiply ${int1} by ${int2}. I can help you break it down!`,
        emotion: 'happy', 
        isLoading: false
      });
    } else {
      setTutorState({
        message: "Not quite! Just remove the dots. For example, 3.9 becomes 39.",
        emotion: 'thinking',
        isLoading: false
      });
    }
  };

  // Logic to determine if we show simple or column multiplication
  const showColumnMul = int1 > 9 && int2 < 10;
  
  const handleColMulOnes = () => {
    const onesDigit = int1 % 10;
    const correctProduct = onesDigit * int2;
    const userVal = parseInt(colMulInputs.ones);

    if (userVal === correctProduct) {
      setColMulStep(1);
      setTutorState({
        message: `Right! ${onesDigit} × ${int2} = ${correctProduct}. We write down the ${correctProduct % 10} and carry the ${Math.floor(correctProduct / 10)}. Now for the next part!`,
        emotion: 'happy',
        isLoading: false
      });
    } else {
      setTutorState({
        message: `Try again! What is ${onesDigit} × ${int2}?`,
        emotion: 'thinking',
        isLoading: false
      });
    }
  };

  const handleColMulTens = () => {
    const onesDigit = int1 % 10;
    const tensDigit = Math.floor(int1 / 10);
    const carry = Math.floor((onesDigit * int2) / 10);
    const correctVal = (tensDigit * int2) + carry;
    const userVal = parseInt(colMulInputs.tens);

    if (userVal === correctVal) {
      setStep(WizardStep.COUNT_DECIMALS);
      setTutorState({
        message: "Awesome! You solved the multiplication. Now, look at the ORIGINAL problem. How many decimal places do we have?",
        emotion: 'celebrating',
        isLoading: false
      });
    } else {
       setTutorState({
        message: `Careful! Multiply ${tensDigit} × ${int2}, then add the carry (${carry}).`,
        emotion: 'thinking',
        isLoading: false
      });
    }
  };

  const handleSimpleMultiplySubmit = async () => {
    const val = parseInt(inputStep2);
    if (val === intProduct) {
      setStep(WizardStep.COUNT_DECIMALS);
      setTutorState({
        message: "Correct! Now, look at the ORIGINAL problem. How many numbers are sitting behind a decimal point?",
        emotion: 'happy',
        isLoading: false
      });
    } else {
      setTutorState(prev => ({ ...prev, isLoading: true }));
      const hint = await getTutorHelp('Integer Multiplication', `${int1} x ${int2}`, inputStep2);
      setTutorState({ message: hint, emotion: 'thinking', isLoading: false });
    }
  };

  const handleCountSubmit = async () => {
    const val = parseInt(inputStep3);
    if (val === totalDecimals) {
      setStep(WizardStep.PLACE_DECIMAL);
      setTutorState({
        message: `Exactly! We have ${totalDecimals} decimal place(s). Now, take your answer (${intProduct}) and move the decimal point ${totalDecimals} hop(s) to the left.`,
        emotion: 'happy',
        isLoading: false
      });
    } else {
      setTutorState(prev => ({ ...prev, isLoading: true }));
      const hint = await getTutorHelp('Counting Decimals', `${problem.num1} x ${problem.num2}`, inputStep3);
      setTutorState({ message: hint, emotion: 'thinking', isLoading: false });
    }
  };

  const handleDecimalMove = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setDecimalPosition(prev => Math.min(prev + 1, intProduct.toString().length + 1));
    } else {
      setDecimalPosition(prev => Math.max(prev - 1, 0));
    }
  };

  const checkFinalAnswer = async () => {
    if (decimalPosition === totalDecimals) {
      setStep(WizardStep.SUCCESS);
      onScoreIncrement(); // Increment score for correct final answer
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.7 } });
      setTutorState(prev => ({ ...prev, isLoading: true }));
      const msg = await getCelebrationMessage();
      setTutorState({ message: msg, emotion: 'celebrating', isLoading: false });
    } else {
      setTutorState({
        message: `Almost! You moved it ${decimalPosition} times, but we need ${totalDecimals} hops. Try again!`,
        emotion: 'thinking',
        isLoading: false
      });
    }
  };

  // --- Render Helpers ---

  const NumberDisplay = ({ num, highlightDecimal = false }: { num: number, highlightDecimal?: boolean }) => {
    const str = num.toString();
    const parts = str.split('.');
    
    if (parts.length === 1) return <span>{str}</span>;
    return (
      <span>
        {parts[0]}
        {highlightDecimal ? (
          <>
            <span className="text-pink-500 font-bold">.</span>
            <span className="bg-pink-100 text-pink-700 rounded px-0.5">{parts[1]}</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">.</span>
            <span>{parts[1]}</span>
          </>
        )}
      </span>
    );
  };

  const DecimalHopper = () => {
    const str = intProduct.toString();
    const chars = str.split('');
    const len = chars.length;
    const paddingNeeded = Math.max(0, decimalPosition - len);
    const paddedChars = Array(paddingNeeded).fill('0').concat(chars);
    const insertIndex = paddedChars.length - decimalPosition;

    return (
      <div className="flex items-center justify-center gap-1 text-5xl font-mono font-bold tracking-wider py-6 bg-white rounded-xl border-2 border-blue-100 shadow-inner">
        {insertIndex <= 0 && <span className="text-gray-400">0</span>}
        
        {paddedChars.map((char, idx) => (
          <React.Fragment key={idx}>
            {idx === insertIndex && (
              <motion.div 
                layoutId="activeDecimal"
                className="w-2 h-2 bg-pink-500 rounded-full mx-1 self-end mb-2"
              />
            )}
            <span>{char}</span>
          </React.Fragment>
        ))}
        {decimalPosition === 0 && (
           <div className="w-2 h-2 bg-gray-300 rounded-full mx-1 self-end mb-2" />
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col relative overflow-visible pb-20">
      
      {/* 1. Header Problem (Always Visible) */}
      <div className="flex flex-col items-center justify-center border-b-2 border-blue-100 pb-6 mb-6">
        <h2 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Original Problem</h2>
        <div className="text-5xl font-mono font-bold text-slate-800 flex gap-3 items-center">
           <NumberDisplay num={problem.num1} />
           <span className="text-blue-400">×</span>
           <NumberDisplay num={problem.num2} />
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Intro Button */}
        {step === WizardStep.INTRO && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Button onClick={handleStart} className="w-full text-xl py-4 shadow-blue-200">
              Start Solving <ArrowDown className="inline ml-2" />
            </Button>
          </motion.div>
        )}

        {/* STEP 1: HIDE DECIMALS */}
        {currentStepIndex >= 1 && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }}
             className={`rounded-2xl border-l-8 ${currentStepIndex > 1 ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50'} p-6 transition-colors duration-500`}
           >
             <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-slate-700 text-lg">Step 1: Remove Decimals</h3>
               {currentStepIndex > 1 && <Check className="text-green-500" />}
             </div>
             
             {step === WizardStep.HIDE_DECIMALS ? (
               <div className="flex flex-col items-center gap-6">
                 <div className="flex items-center justify-center gap-4 text-3xl font-mono text-slate-600">
                    <input 
                      value={inputStep1.v1}
                      onChange={(e) => setInputStep1(p => ({ ...p, v1: e.target.value }))}
                      placeholder="?"
                      className="w-24 p-2 text-center border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none"
                    />
                    <span>×</span>
                    <input 
                      value={inputStep1.v2}
                      onChange={(e) => setInputStep1(p => ({ ...p, v2: e.target.value }))}
                      placeholder="?"
                      className="w-24 p-2 text-center border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none"
                    />
                 </div>
                 <Button onClick={checkStep1} disabled={!inputStep1.v1 || !inputStep1.v2}>
                   Check Integers
                 </Button>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-2">
                 {totalDecimals === 0 && (
                    <span className="text-sm font-bold text-blue-500 bg-blue-100 px-3 py-1 rounded-full animate-pulse">
                      Skipped: No decimals found!
                    </span>
                 )}
                 <div className="flex items-center justify-center gap-4 text-3xl font-mono text-slate-800">
                    <span className="font-bold">{int1}</span>
                    <span>×</span>
                    <span className="font-bold">{int2}</span>
                 </div>
               </div>
             )}
           </motion.div>
        )}

        {/* STEP 2: MULTIPLY */}
        {currentStepIndex >= 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border-l-8 ${currentStepIndex > 2 ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50'} p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-700 text-lg">Step 2: Multiply Integers</h3>
              {currentStepIndex > 2 && <Check className="text-green-500" />}
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              {/* Show simple Result if Done */}
              {currentStepIndex > 2 ? (
                 <div className="text-3xl font-mono font-bold text-slate-800">
                   {int1} × {int2} = {intProduct}
                 </div>
              ) : showColumnMul ? (
                /* COLUMN MULTIPLICATION UI */
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="font-mono text-4xl font-bold grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-right relative">
                    {/* Top Row: e.g. 39 */}
                    <div className="col-span-2 tracking-widest relative">
                      {/* Tens Digit */}
                      <span className={colMulStep === 1 ? "text-blue-500 scale-110 inline-block transition-transform font-bold" : ""}>
                        {Math.floor(int1 / 10)}
                      </span>
                      
                      {/* Ones Digit */}
                      <span className={colMulStep === 0 ? "text-blue-500 scale-110 inline-block transition-transform font-bold" : ""}>
                        {int1 % 10}
                      </span>
                      
                      {/* Carry Over Indicator */}
                      {colMulStep === 1 && (
                        <motion.span 
                           initial={{ y: 0, opacity: 0 }} 
                           animate={{ y: -30, opacity: 1 }} 
                           className="absolute -top-2 left-0 text-xl font-bold text-pink-500"
                        >
                          +{Math.floor(((int1 % 10) * int2) / 10)}
                        </motion.span>
                      )}
                    </div>
                    
                    {/* Bottom Row: e.g. x 5 */}
                    <div className="text-slate-400">×</div>
                    <div className="tracking-widest text-blue-500">{int2}</div>
                    
                    {/* Divider */}
                    <div className="col-span-2 border-b-4 border-slate-700 my-1"></div>
                    
                    {/* Answer Row */}
                    <div className="col-span-2 flex justify-end gap-2">
                       {/* Tens place input (Step 1) */}
                       {colMulStep >= 1 ? (
                          colMulStep === 1 ? (
                            <input 
                              autoFocus
                              value={colMulInputs.tens}
                              onChange={(e) => setColMulInputs(p => ({ ...p, tens: e.target.value }))}
                              className="w-16 h-12 text-center border-2 border-blue-300 rounded focus:border-blue-500 bg-blue-50"
                              placeholder="?"
                            />
                          ) : (
                            <span>{Math.floor(intProduct / 10)}</span>
                          )
                       ) : null}

                       {/* Ones place input (Step 0) */}
                       {colMulStep === 0 ? (
                         <input 
                           autoFocus
                           value={colMulInputs.ones}
                           onChange={(e) => setColMulInputs(p => ({ ...p, ones: e.target.value }))}
                           className="w-12 h-12 text-center border-2 border-blue-300 rounded focus:border-blue-500 bg-blue-50"
                           placeholder="?"
                         />
                       ) : (
                         <span>{intProduct % 10}</span>
                       )}
                    </div>
                  </div>

                  {/* Instructions/Button for Col Mul */}
                  <div className="mt-6 w-full max-w-xs">
                     {colMulStep === 0 && (
                       <div className="space-y-2">
                         <p className="text-center text-slate-500 text-sm">
                           First, multiply <strong className="text-blue-500">{int1 % 10}</strong> × <strong className="text-blue-500">{int2}</strong>
                         </p>
                         <Button onClick={handleColMulOnes} className="w-full py-2">Check Ones</Button>
                       </div>
                     )}
                     {colMulStep === 1 && (
                       <div className="space-y-2">
                         <p className="text-center text-slate-500 text-sm">
                           Now multiply <strong className="text-blue-500">{Math.floor(int1/10)}</strong> × <strong className="text-blue-500">{int2}</strong>, then add the carry (<strong className="text-pink-500">{Math.floor(((int1%10)*int2)/10)}</strong>)
                         </p>
                         <Button onClick={handleColMulTens} className="w-full py-2">Check Final</Button>
                       </div>
                     )}
                  </div>
                </div>
              ) : (
                /* SIMPLE MULTIPLICATION UI (fallback for 2x3 etc) */
                <div className="w-full flex gap-2">
                   <input 
                     type="number" 
                     autoFocus
                     inputMode="numeric"
                     value={inputStep2}
                     onChange={(e) => setInputStep2(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSimpleMultiplySubmit()}
                     className="flex-grow p-3 rounded-xl border-2 border-blue-200 text-center text-2xl font-bold outline-none focus:border-blue-500"
                     placeholder="?"
                   />
                   <Button onClick={handleSimpleMultiplySubmit}>Check</Button>
                 </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: COUNT DECIMALS */}
        {currentStepIndex >= 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border-l-8 ${currentStepIndex > 3 ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50'} p-6`}
          >
             <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-slate-700 text-lg">Step 3: Count Decimal Places</h3>
               {currentStepIndex > 3 && <Check className="text-green-500" />}
             </div>

             <div className="flex flex-col items-center gap-4">
               <div className="text-lg text-slate-600 text-center">
                 Look at the top. How many digits are after the dots?
               </div>
               <div className="flex items-center gap-4 text-2xl font-mono bg-white/50 p-4 rounded-xl">
                 <NumberDisplay num={problem.num1} highlightDecimal={true} />
                 <span>×</span>
                 <NumberDisplay num={problem.num2} highlightDecimal={true} />
               </div>

               {step === WizardStep.COUNT_DECIMALS && (
                  <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
                    {[0,1,2,3,4].map(n => (
                      <button
                        key={n}
                        onClick={() => { setInputStep3(n.toString()); }}
                        className={`aspect-square rounded-xl font-bold text-xl transition-all ${inputStep3 === n.toString() ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-white text-blue-500 hover:bg-blue-100'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
               )}
               {step === WizardStep.COUNT_DECIMALS && inputStep3 !== '' && (
                 <Button onClick={handleCountSubmit} className="w-full">Confirm: {inputStep3}</Button>
               )}
               
               {currentStepIndex > 3 && (
                 <div className="font-bold text-green-600 text-xl">
                   Total: {totalDecimals} place(s)
                 </div>
               )}
             </div>
          </motion.div>
        )}

        {/* STEP 4: PLACE DECIMAL */}
        {currentStepIndex >= 4 && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }}
             className={`rounded-2xl border-l-8 ${currentStepIndex > 4 ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50'} p-6`}
           >
             <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-slate-700 text-lg">Step 4: Place the Decimal</h3>
               {currentStepIndex > 4 && <Check className="text-green-500" />}
             </div>

             {currentStepIndex === 4 ? (
               <div className="space-y-6">
                 <p className="text-center text-slate-600">
                   Move the dot <strong>{totalDecimals}</strong> time(s) to the left!
                 </p>
                 
                 <DecimalHopper />
                 
                 <div className="flex justify-between gap-2">
                   <Button onClick={() => handleDecimalMove('left')} variant="secondary" className="flex-1">
                     <MoveLeft className="mr-1" /> Left
                   </Button>
                   <Button onClick={() => handleDecimalMove('right')} variant="secondary" className="flex-1" disabled={decimalPosition === 0}>
                     Right <MoveRight className="ml-1" />
                   </Button>
                 </div>
                 
                 <div className="text-center text-sm font-bold text-slate-400 uppercase">
                    Current Hops: {decimalPosition}
                 </div>

                 <Button onClick={checkFinalAnswer} variant="success" className="w-full">
                   Check Answer
                 </Button>
               </div>
             ) : (
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold text-green-600 mb-2">
                    {(problem.num1 * problem.num2).toFixed(Math.max(countDecimalPlaces(problem.num1) + countDecimalPlaces(problem.num2), 1)).replace(/\.0+$/, '')}
                  </div>
                </div>
             )}
           </motion.div>
        )}

        {/* SUCCESS */}
        {step === WizardStep.SUCCESS && (
          <motion.div 
             initial={{ scale: 0.8, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }}
             className="text-center pt-8 pb-4"
           >
             <h2 className="text-3xl font-bold text-blue-600 mb-4">Solved!</h2>
             <Button onClick={onNextProblem} className="w-full py-4 text-xl shadow-lg shadow-blue-200">
               Next Problem <RefreshCcw className="ml-2 inline" />
             </Button>
           </motion.div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </Card>
  );
};