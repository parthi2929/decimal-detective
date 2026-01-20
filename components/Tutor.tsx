import React from 'react';
import { TutorState } from '../types';
import { Brain, Smile, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorProps {
  state: TutorState;
}

export const Tutor: React.FC<TutorProps> = ({ state }) => {
  const getIcon = () => {
    switch (state.emotion) {
      case 'happy': return <Smile className="w-12 h-12 text-blue-500" />;
      case 'celebrating': return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'thinking': return <Brain className="w-12 h-12 text-purple-500 animate-pulse" />;
      default: return <Clock className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-start gap-4 max-w-2xl mx-auto mb-8 w-full">
      <div className="flex-shrink-0 bg-white p-3 rounded-full shadow-lg border-2 border-blue-100">
        {getIcon()}
      </div>
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div 
            key={state.message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white px-6 py-4 rounded-2xl rounded-tl-none shadow-md border border-blue-50 text-slate-700 text-lg leading-relaxed relative"
          >
            {state.isLoading ? (
               <span className="flex items-center gap-2 text-slate-400">
                 Thinking...
               </span>
            ) : (
              state.message
            )}
             {/* Speech bubble triangle */}
            <div className="absolute top-0 -left-[10px] w-0 h-0 border-t-[15px] border-t-white border-l-[15px] border-l-transparent"></div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
