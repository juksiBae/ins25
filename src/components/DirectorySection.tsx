import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student } from '../types';
import { useAuth } from '../lib/AuthContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Search, MapPin, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export default function DirectorySection() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nim: '',
    name: '',
    origin: '',
    nickname: '',
    avatarUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('nim', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setStudents(studentData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });
    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.origin.toLowerCase().includes(search.toLowerCase()) ||
    s.nim.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), formData);
      } else {
        await addDoc(collection(db, 'students'), {
          ...formData,
          id: Date.now().toString(), // Temporary ID, Firestore will provide doc ID
          addedBy: profile?.uid
        });
      }
      setIsAddDialogOpen(false);
      setEditingStudent(null);
      setFormData({ nim: '', name: '', origin: '', nickname: '', avatarUrl: '' });
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert('Gagal menyimpan data: ' + (error.message || 'Izin ditolak'));
    }
  };

  const handleDelete = async () => {
    console.log('handleDelete called, studentToDelete:', studentToDelete);
    if (!studentToDelete) {
      console.warn('handleDelete: studentToDelete is null');
      return;
    }
    
    try {
      console.log('Attempting to delete student document:', studentToDelete);
      const studentRef = doc(db, 'students', studentToDelete);
      await deleteDoc(studentRef);
      console.log('Successfully deleted student document');
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      setError('Gagal menghapus: ' + (error.message || 'Izin ditolak'));
      setTimeout(() => setError(null), 5000);
    }
  };

  const canEdit = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.email === 'fafaku6@gmail.com';
  const canDelete = profile?.role === 'admin' || profile?.email === 'fafaku6@gmail.com';

  const studentBeingDeleted = students.find(s => s.id === studentToDelete);

  return (
    <div className="space-y-6">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium"
        >
          {error}
        </motion.div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIM, atau asal..."
            className="pl-10 h-12 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger
              render={
                <Button className="h-12 px-6 gap-2">
                  <UserPlus className="h-5 w-5" /> Tambah Teman
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStudent ? 'Edit Data Teman' : 'Tambah Teman Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                  placeholder="NIM (Contoh: 2514400001)" 
                  value={formData.nim} 
                  onChange={e => setFormData({...formData, nim: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Nama Lengkap" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Nama Panggilan" 
                  value={formData.nickname} 
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Asal Kota" 
                  value={formData.origin} 
                  onChange={e => setFormData({...formData, origin: e.target.value})}
                  required
                />
                <Input 
                  placeholder="URL Foto (Opsional)" 
                  value={formData.avatarUrl} 
                  onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                />
                <Button type="submit" className="w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                  <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{student.name}</h3>
                  <div className="text-xs font-mono text-primary mb-1">{student.nim}</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{student.origin}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingStudent(student);
                        setFormData({
                          nim: student.nim,
                          name: student.name,
                          origin: student.origin,
                          nickname: student.nickname,
                          avatarUrl: student.avatarUrl || ''
                        });
                        setIsAddDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        console.log('Delete button clicked for student:', student.id, student.name);
                        setStudentToDelete(student.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Apakah Anda yakin ingin menghapus data <strong>{studentBeingDeleted?.name || 'teman ini'}</strong>? Tindakan ini tidak dapat dibatalkan.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => {
              console.log('Cancel delete clicked');
              setIsDeleteDialogOpen(false);
            }}>Batal</Button>
            <Button variant="destructive" onClick={() => {
              console.log('Confirm delete clicked');
              handleDelete();
            }}>Hapus Sekarang</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
