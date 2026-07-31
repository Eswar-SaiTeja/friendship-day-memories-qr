'use client';

import { useState } from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface MiniQuizProps {
  questions: Question[];
  onUnlock: () => void;
}

export default function MiniQuiz({ questions, onUnlock }: MiniQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'success' | 'error'>('idle');
  const [shake, setShake] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIdx];

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setQuizState('idle');
  };

  const handleNext = () => {
    if (!selectedOption) return;

    const isCorrect = selectedOption.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();

    if (isCorrect) {
      setQuizState('success');
      
      // Trigger a small burst of confetti per correct answer
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      setTimeout(() => {
        if (currentIdx + 1 < questions.length) {
          setCurrentIdx(currentIdx + 1);
          setSelectedOption(null);
          setQuizState('idle');
        } else {
          setCompleted(true);
          onUnlock();
          // Huge celebration confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      }, 1200);
    } else {
      setQuizState('error');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={`w-full max-w-lg mx-auto bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-500 ${
      shake ? 'animate-bounce' : ''
    }`}>
      {!completed ? (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-pink-500" />
              <span>Friendship Trivia Quiz</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full">
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <p className="text-base text-slate-200 mb-6 font-semibold">
            {currentQuestion.question}
          </p>

          {/* Options Grid */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option) => {
              let btnClass = 'bg-slate-950/40 border-white/5 hover:bg-slate-800/40 text-slate-300';
              if (selectedOption === option) {
                if (quizState === 'success') {
                  btnClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-400';
                } else if (quizState === 'error') {
                  btnClass = 'bg-rose-500/10 border-rose-500 text-rose-400';
                } else {
                  btnClass = 'bg-pink-500/10 border-pink-500 text-pink-400';
                }
              }

              return (
                <button
                  key={option}
                  disabled={quizState === 'success'}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full text-left px-4 py-3.5 border rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                  {selectedOption === option && quizState === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  {selectedOption === option && quizState === 'error' && (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!selectedOption || quizState === 'success'}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>{currentIdx + 1 === questions.length ? 'Unlock Gallery' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-scale-up" />
          <h3 className="text-xl font-bold text-white mb-2">Quiz Completed!</h3>
          <p className="text-slate-400 text-sm mb-4">
            You know your friend so well! The hidden memory vault has been unlocked.
          </p>
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-500/15 text-pink-400 border border-pink-500/30 rounded-xl text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Vault Unlocked</span>
          </div>
        </div>
      )}
    </div>
  );
}
