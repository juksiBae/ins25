import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student, GameMode } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RefreshCw, Trophy } from 'lucide-react';

export default function GameSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('NAME_TO_ORIGIN');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setStudents(studentData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });
    return () => unsubscribe();
  }, []);

  const generateQuestion = useCallback(() => {
    if (students.length < 4) return;

    const randomStudent = students[Math.floor(Math.random() * students.length)];
    setCurrentStudent(randomStudent);
    setFeedback(null);

    const wrongOptions: string[] = [];
    while (wrongOptions.length < 3) {
      const other = students[Math.floor(Math.random() * students.length)];
      const optionValue = gameMode === 'NAME_TO_ORIGIN' ? other.origin : other.name;
      const correctValue = gameMode === 'NAME_TO_ORIGIN' ? randomStudent.origin : randomStudent.name;
      
      if (optionValue !== correctValue && !wrongOptions.includes(optionValue)) {
        wrongOptions.push(optionValue);
      }
    }

    const correctValue = gameMode === 'NAME_TO_ORIGIN' ? randomStudent.origin : randomStudent.name;
    const allOptions = [...wrongOptions, correctValue].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, [gameMode, students]);

  useEffect(() => {
    setFeedback(null);
    setCurrentStudent(null);
    setOptions([]);
  }, [gameMode]);

  useEffect(() => {
    if (students.length > 0 && !currentStudent) {
      generateQuestion();
    }
  }, [students, currentStudent, generateQuestion]);

  const handleAnswer = (answer: string) => {
    if (feedback) return;

    const correctValue = gameMode === 'NAME_TO_ORIGIN' ? currentStudent?.origin : currentStudent?.name;
    const isCorrect = answer === correctValue;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTotalPlayed(prev => prev + 1);
    if (isCorrect) setScore(prev => prev + 1);

    setTimeout(() => {
      generateQuestion();
    }, 1500);
  };

  if (students.length < 4) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Butuh minimal 4 data teman untuk memulai game.</p>
        <p className="text-sm">Silakan tambahkan data di menu "Teman".</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-bold">Skor: {score} / {totalPlayed}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={gameMode === 'NAME_TO_ORIGIN' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setGameMode('NAME_TO_ORIGIN')}
          >
            Tebak Asal
          </Button>
          <Button 
            variant={gameMode === 'ORIGIN_TO_NAME' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setGameMode('ORIGIN_TO_NAME')}
          >
            Tebak Nama
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStudent?.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {gameMode === 'NAME_TO_ORIGIN' ? (
                  <>Dari mana asal <span className="text-primary">{currentStudent?.name}</span>?</>
                ) : (
                  <>Siapa yang berasal dari <span className="text-primary">{currentStudent?.origin}</span>?</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className={`h-20 text-lg font-medium transition-all ${
                      feedback === 'correct' && option === (gameMode === 'NAME_TO_ORIGIN' ? currentStudent?.origin : currentStudent?.name)
                        ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-100'
                        : feedback === 'wrong' && option === (gameMode === 'NAME_TO_ORIGIN' ? currentStudent?.origin : currentStudent?.name)
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : feedback === 'wrong' && option !== (gameMode === 'NAME_TO_ORIGIN' ? currentStudent?.origin : currentStudent?.name)
                        ? 'opacity-50'
                        : 'hover:border-primary hover:bg-primary/5'
                    }`}
                    onClick={() => handleAnswer(option)}
                    disabled={!!feedback}
                  >
                    {option}
                  </Button>
                ))}
              </div>

              <div className="h-12 flex justify-center items-center">
                {feedback === 'correct' && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="flex items-center text-green-600 gap-2 font-bold"
                  >
                    <CheckCircle2 className="h-6 w-6" /> Benar!
                  </motion.div>
                )}
                {feedback === 'wrong' && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="flex items-center text-red-600 gap-2 font-bold"
                  >
                    <XCircle className="h-6 w-6" /> Kurang Tepat!
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="text-center">
        <Button variant="ghost" onClick={generateQuestion} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Lewati
        </Button>
      </div>
    </div>
  );
}
