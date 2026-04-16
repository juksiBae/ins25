import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, writeBatch, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole, Student, GalleryItem, AppSettings } from '../types';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Shield, User, UserCheck, UserCog, Mail, Upload, FileJson, CheckCircle2, Loader2, Image as ImageIcon, Trash2, Plus, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminSection() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  
  // Gallery Form State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

  // App Settings State
  const [settings, setSettings] = useState<AppSettings>({
    featuredMemoryUrl: '',
    featuredMemoryTitle: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    // Users listener
    const uq = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(uq, (snapshot) => {
      const userData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(userData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Gallery listener
    const gq = query(collection(db, 'gallery'), orderBy('addedAt', 'desc'));
    const unsubscribeGallery = onSnapshot(gq, (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GalleryItem));
      setGallery(galleryData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });

    // Settings listener
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGallery();
      unsubscribeSettings();
    };
  }, [profile]);

  const updateSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'app'), settings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/app');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const addGalleryPhoto = async () => {
    if (!newPhotoUrl.trim() || !newPhotoTitle.trim()) return;
    setIsAddingPhoto(true);
    try {
      const id = `photo_${Date.now()}`;
      await setDoc(doc(db, 'gallery', id), {
        url: newPhotoUrl,
        title: newPhotoTitle,
        addedAt: Date.now()
      });
      setNewPhotoUrl('');
      setNewPhotoTitle('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'gallery');
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteGalleryPhoto = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

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
            <Settings className="h-6 w-6 text-primary" />
            <CardTitle>Pengaturan Utama</CardTitle>
          </div>
          <CardDescription>
            Sesuaikan konten utama yang tampil di halaman depan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Featured Memory</label>
              <Input 
                placeholder="URL Foto Utama" 
                value={settings.featuredMemoryUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, featuredMemoryUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Judul Featured Memory</label>
              <Input 
                placeholder="Judul Foto Utama" 
                value={settings.featuredMemoryTitle}
                onChange={(e) => setSettings(prev => ({ ...prev, featuredMemoryTitle: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={updateSettings} disabled={isSavingSettings} className="gap-2">
              {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            <CardTitle>Kelola Galeri Perjuangan</CardTitle>
          </div>
          <CardDescription>
            Tambahkan atau hapus foto momen kebersamaan angkatan 25 yang tampil di halaman Home.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border-2 border-dashed border-muted">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Foto</label>
              <Input 
                placeholder="https://example.com/foto.jpg" 
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Judul Momen</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Contoh: Makrab 2025" 
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                />
                <Button onClick={addGalleryPhoto} disabled={isAddingPhoto || !newPhotoUrl || !newPhotoTitle}>
                  {isAddingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {gallery.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                    <p className="text-[10px] text-white font-bold uppercase mb-2">{item.title}</p>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => deleteGalleryPhoto(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

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
