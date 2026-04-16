import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student, GameMode } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RefreshCw, Trophy, Timer, Zap, Target, BarChart3, Play, Gamepad2, Users } from 'lucide-react';

type GameState = 'idle' | 'playing' | 'finished';

interface GameStats {
  correct: number;
  total: number;
  startTime: number;
  endTime: number;
  answerTimes: number[];
}

export default function GameSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('NAME_TO_ORIGIN');
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [stats, setStats] = useState<GameStats>({
    correct: 0,
    total: 0,
    startTime: 0,
    endTime: 0,
    answerTimes: []
  });
  
  const lastStudentId = useRef<string | null>(null);
  const questionStartTime = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    let randomStudent: Student;
    // Prevent repeating the same student twice in a row
    do {
      randomStudent = students[Math.floor(Math.random() * students.length)];
    } while (randomStudent.id === lastStudentId.current && students.length > 1);

    lastStudentId.current = randomStudent.id;
    setCurrentStudent(randomStudent);
    setFeedback(null);
    questionStartTime.current = Date.now();

    const wrongOptions: string[] = [];
    const correctValue = (gameMode === 'NAME_TO_ORIGIN' ? randomStudent.origin : randomStudent.name) as string;
    
    // Get all possible unique values for the current mode
    const allPossibleValues = Array.from(new Set(students.map(s => 
      (gameMode === 'NAME_TO_ORIGIN' ? s.origin : s.name) as string
    ))).filter(v => v !== correctValue);

    // Shuffle possible values and take up to 3
    const shuffledWrong = allPossibleValues.sort(() => Math.random() - 0.5).slice(0, 3) as string[];
    wrongOptions.push(...shuffledWrong);

    const allOptions = [...wrongOptions, correctValue].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, [gameMode, students]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(60);
    setStats({
      correct: 0,
      total: 0,
      startTime: Date.now(),
      endTime: 0,
      answerTimes: []
    });
    generateQuestion();
  };

  const endGame = useCallback(() => {
    setGameState('finished');
    setStats(prev => ({ ...prev, endTime: Date.now() }));
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft, endGame]);

  const handleAnswer = (answer: string) => {
    if (feedback || gameState !== 'playing') return;

    const correctValue = (gameMode === 'NAME_TO_ORIGIN' ? currentStudent?.origin : currentStudent?.name) || '';
    const isCorrect = answer === correctValue;
    const timeTaken = Date.now() - questionStartTime.current;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      answerTimes: [...prev.answerTimes, timeTaken]
    }));

    setTimeout(() => {
      if (gameState === 'playing') {
        generateQuestion();
      }
    }, 800);
  };

  if (students.length < 4) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Butuh minimal 4 data teman untuk memulai game.</p>
        <p className="text-sm">Silakan tambahkan data di menu "Teman".</p>
      </div>
    );
  }

  if (gameState === 'idle') {
    return (
      <div className="max-w-md mx-auto py-12 space-y-8">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 bg-primary/10 rounded-full mb-4"
          >
            <Gamepad2 className="h-12 w-12 text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold tracking-tight">Siap Uji Hafalanmu?</h2>
          <p className="text-muted-foreground">Tebak asal atau nama temanmu dalam waktu 60 detik. Semakin cepat, semakin baik!</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:border-primary ${gameMode === 'NAME_TO_ORIGIN' ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setGameMode('NAME_TO_ORIGIN')}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" /> Tebak Asal
              </CardTitle>
              <CardDescription>Diberikan nama, tebak asal kotanya.</CardDescription>
            </CardHeader>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:border-primary ${gameMode === 'ORIGIN_TO_NAME' ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setGameMode('ORIGIN_TO_NAME')}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" /> Tebak Nama
              </CardTitle>
              <CardDescription>Diberikan asal kota, tebak siapa orangnya.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Button size="lg" className="w-full h-16 text-xl font-bold gap-2 shadow-xl shadow-primary/20" onClick={startGame}>
          <Play className="h-6 w-6 fill-current" /> MULAI GAME
        </Button>
      </div>
    );
  }

  if (gameState === 'finished') {
    const avgTime = stats.answerTimes.length > 0 
      ? (stats.answerTimes.reduce((a, b) => a + b, 0) / stats.answerTimes.length / 1000).toFixed(2)
      : 0;
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
      <div className="max-w-md mx-auto py-8 space-y-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <Trophy className="h-12 w-12 text-yellow-600" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter">WAKTU HABIS!</h2>
          <p className="text-muted-foreground">Hasil perjuanganmu mengenali teman:</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-black text-primary">{stats.correct}</div>
              <div className="text-xs uppercase font-bold text-muted-foreground">Benar</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-black text-primary">{accuracy}%</div>
              <div className="text-xs uppercase font-bold text-muted-foreground">Akurasi</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-black text-primary">{avgTime}s</div>
              <div className="text-xs uppercase font-bold text-muted-foreground">Rata-rata</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-black text-primary">{stats.total}</div>
              <div className="text-xs uppercase font-bold text-muted-foreground">Total Soal</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Button size="lg" className="w-full h-14 text-lg font-bold gap-2" onClick={startGame}>
            <RefreshCw className="h-5 w-5" /> MAIN LAGI
          </Button>
          <Button size="lg" variant="outline" className="w-full h-14 text-lg font-bold" onClick={() => setGameState('idle')}>
            KEMBALI KE MENU
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-card border shadow-sm p-4 rounded-2xl sticky top-20 z-40 backdrop-blur-sm bg-card/90">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-black text-primary">{stats.correct}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
            <Timer className="h-4 w-4" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
        </div>
        <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {gameMode === 'NAME_TO_ORIGIN' ? 'Tebak Asal' : 'Tebak Nama'}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStudent?.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-2 overflow-hidden relative">
            {feedback === 'correct' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-green-500/10 z-0 pointer-events-none" 
              />
            )}
            {feedback === 'wrong' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-red-500/10 z-0 pointer-events-none" 
              />
            )}
            
            <CardHeader className="text-center relative z-10">
              <CardTitle className="text-2xl md:text-3xl font-black tracking-tight">
                {gameMode === 'NAME_TO_ORIGIN' ? (
                  <>Dari mana asal <span className="text-primary underline decoration-primary/30 underline-offset-8">{currentStudent?.name}</span>?</>
                ) : (
                  <>Siapa yang berasal dari <span className="text-primary underline decoration-primary/30 underline-offset-8">{currentStudent?.origin}</span>?</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map((option) => {
                  const isCorrectOption = option === (gameMode === 'NAME_TO_ORIGIN' ? currentStudent?.origin : currentStudent?.name);
                  return (
                    <Button
                      key={option}
                      variant="outline"
                      className={`h-24 text-lg font-bold rounded-xl transition-all border-2 ${
                        feedback === 'correct' && isCorrectOption
                          ? 'bg-green-500 border-green-600 text-white hover:bg-green-500 scale-105 shadow-lg shadow-green-500/20'
                          : feedback === 'wrong' && isCorrectOption
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : feedback === 'wrong' && !isCorrectOption
                          ? 'opacity-40 grayscale'
                          : 'hover:border-primary hover:bg-primary/5 active:scale-95'
                      }`}
                      onClick={() => handleAnswer(option)}
                      disabled={!!feedback}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>

              <div className="h-16 flex justify-center items-center">
                <AnimatePresence>
                  {feedback === 'correct' && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0, scale: 0.5 }} 
                      animate={{ y: 0, opacity: 1, scale: 1 }} 
                      className="flex flex-col items-center text-green-600"
                    >
                      <div className="flex items-center gap-2 font-black text-2xl italic">
                        <Zap className="h-8 w-8 fill-current" /> MANTAP!
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest">+1 Poin</div>
                    </motion.div>
                  )}
                  {feedback === 'wrong' && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0, scale: 0.5 }} 
                      animate={{ y: 0, opacity: 1, scale: 1 }} 
                      className="flex flex-col items-center text-red-600"
                    >
                      <div className="flex items-center gap-2 font-black text-2xl italic">
                        <XCircle className="h-8 w-8" /> SALAH!
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest">Tetap Semangat</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-4">
        <Button variant="ghost" onClick={generateQuestion} className="gap-2 font-bold text-muted-foreground hover:text-primary" disabled={!!feedback}>
          <RefreshCw className="h-4 w-4" /> Lewati
        </Button>
        <Button variant="ghost" onClick={endGame} className="gap-2 font-bold text-muted-foreground hover:text-red-500">
          Selesai
        </Button>
      </div>
    </div>
  );
}
