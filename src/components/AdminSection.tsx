import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, Student } from '../types';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Shield, User, UserCheck, UserCog, Mail, Upload, FileJson, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSection() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(userData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [profile]);

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleBulkImport = async () => {
    if (!csvData.trim()) return;
    setIsImporting(true);
    setImportStatus('Memproses data...');

    try {
      const lines = csvData.split('\n');
      const batch = writeBatch(db);
      let count = 0;

      // Skip header if present
      const startIndex = lines[0].toUpperCase().includes('NAMA') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, nim, origin] = line.split(',').map(s => s.trim());
        if (!name || !nim || !origin) continue;

        const studentId = `student_${nim}`;
        const studentRef = doc(db, 'students', studentId);
        
        const newStudent: Omit<Student, 'id'> = {
          nim,
          name,
          origin,
          nickname: name.split(' ')[0], // Default nickname to first name
          addedBy: profile?.uid
        };

        batch.set(studentRef, newStudent);
        count++;

        // Firestore batch limit is 500
        if (count % 500 === 0) {
          await batch.commit();
        }
      }

      if (count % 500 !== 0) {
        await batch.commit();
      }

      setImportStatus(`Berhasil mengimpor ${count} data mahasiswa!`);
      setCsvData('');
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('Gagal mengimpor data. Pastikan format CSV benar.');
    } finally {
      setIsImporting(false);
    }
  };

  if (profile?.role !== 'admin') {
    return <div className="text-center py-20">Akses Ditolak.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            <CardTitle>Impor Data Massal</CardTitle>
          </div>
          <CardDescription>
            Tempel data CSV (NAMA, NIM, ASAL) untuk memasukkan data satu angkatan sekaligus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full h-40 p-3 rounded-md border bg-background font-mono text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="NAMA,NIM,ASAL&#10;Putri Reda Meisyah,251440001,Palembang&#10;Muhammad Sayyid Dzaky,251440002,Tanjung Uban"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {importStatus && (
                <span className={`flex items-center gap-1 ${importStatus.includes('Berhasil') ? 'text-green-600' : 'text-red-600'}`}>
                  {importStatus.includes('Berhasil') ? <CheckCircle2 className="h-4 w-4" /> : null}
                  {importStatus}
                </span>
              )}
            </div>
            <Button 
              onClick={handleBulkImport} 
              disabled={isImporting || !csvData.trim()}
              className="gap-2"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Mulai Impor
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Manajemen Pengguna</CardTitle>
          </div>
          <CardDescription>
            Kelola peran anggota angkatan. Anda dapat mempromosikan peserta menjadi moderator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {users.map((user) => (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-2 rounded-full">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {user.displayName || 'Anonymous'}
                        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {user.role === 'participant' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => updateUserRole(user.uid, 'moderator')}
                      >
                        <UserCheck className="h-4 w-4" /> Jadikan Moderator
                      </Button>
                    )}
                    {user.role === 'moderator' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="gap-2 text-muted-foreground"
                        onClick={() => updateUserRole(user.uid, 'participant')}
                      >
                        <User className="h-4 w-4" /> Turunkan ke Peserta
                      </Button>
                    )}
                    {profile.uid === user.uid && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">Anda</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
