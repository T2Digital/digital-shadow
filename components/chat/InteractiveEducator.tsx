import React, { useState } from 'react';
import { BookOpen, Check, X, Repeat, BrainCircuit } from 'lucide-react';

export const InteractiveEducator = ({ card }: { card: any }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);
    
    const items = card.items || [];
    const isQuiz = card.type === 'quiz';
    
    if (items.length === 0) return null;
    
    const currentItem = items[currentIndex];

    const handleAnswer = (selected: string) => {
        if (showAnswer) return;
        
        if (isQuiz) {
            if (selected === currentItem.answer) {
                setScore(s => s + 1);
            }
        }
        setShowAnswer(true);
    };

    const nextItem = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(i => i + 1);
            setShowAnswer(false);
        } else {
            setCompleted(true);
        }
    };

    const reset = () => {
        setCurrentIndex(0);
        setShowAnswer(false);
        setScore(0);
        setCompleted(false);
    };

    if (completed) {
        return (
            <div className="mt-4 rounded-[22px] p-6 w-full md:w-[380px] bg-[#000000]/95 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col items-center text-center">
                <BrainCircuit className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">اكتمل!</h3>
                {isQuiz && (
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-4">
                        النتيجة: {score} / {items.length}
                    </div>
                )}
                <button onClick={reset} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors">
                    <Repeat className="w-4 h-4" /> إعادة
                </button>
            </div>
        );
    }

    return (
        <div className="mt-4 rounded-[22px] p-5 w-full md:w-[380px] bg-[#000000]/95 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                    <BookOpen className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-[15px] text-white">{card.title}</h3>
                    <p className="text-[11px] text-white/50">{isQuiz ? 'اختبار تفاعلي' : 'كروت حفظ (Flashcards)'} - سؤال {currentIndex + 1} من {items.length}</p>
                </div>
            </div>

            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5 min-h-[100px] flex items-center justify-center text-center">
                <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed">{currentItem.question}</p>
            </div>

            {isQuiz ? (
                <div className="space-y-2 mb-4">
                    {currentItem.options?.map((opt: string, i: number) => {
                        const isCorrect = opt === currentItem.answer;
                        let btnClass = "w-full p-3 rounded-xl border text-sm font-medium transition-all text-right ";
                        
                        if (!showAnswer) {
                            btnClass += "border-white/10 bg-white/5 hover:bg-white/10 text-white/80";
                        } else {
                            if (isCorrect) {
                                btnClass += "border-emerald-500/50 bg-emerald-500/20 text-emerald-300";
                            } else {
                                btnClass += "border-white/5 bg-white/5 text-white/30 opacity-50";
                            }
                        }

                        return (
                            <button 
                                key={i} 
                                onClick={() => handleAnswer(opt)}
                                disabled={showAnswer}
                                className={btnClass}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="mb-4">
                    {!showAnswer ? (
                        <button onClick={() => setShowAnswer(true)} className="w-full p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold transition-colors">
                            إظهار الإجابة
                        </button>
                    ) : (
                        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-center font-medium">
                            {currentItem.answer}
                        </div>
                    )}
                </div>
            )}

            {showAnswer && currentItem.explanation && (
                <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200/90 text-xs leading-relaxed">
                    <span className="font-bold">شرح: </span>{currentItem.explanation}
                </div>
            )}

            {showAnswer && (
                <button onClick={nextItem} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20">
                    {currentIndex < items.length - 1 ? 'السؤال التالي' : 'إنهاء'}
                </button>
            )}
        </div>
    );
};
