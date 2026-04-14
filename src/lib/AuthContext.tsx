import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Listen to user profile changes
        const unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
            setError(null);
          } else {
            const isAdminEmail = currentUser.email === 'fafaku6@gmail.com';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: isAdminEmail ? 'admin' : 'participant',
              displayName: currentUser.displayName || ''
            };
            setDoc(userDocRef, newProfile).catch(err => {
              console.error('Error creating profile:', err);
            });
          }
          setIsAuthReady(true);
          setLoading(false);
        }, (err) => {
          console.error('Profile Snapshot Error for UID:', currentUser.uid, err);
          // If it's a permission error, we'll show a more helpful message
          if (err.message.includes('permission')) {
            setError(`Izin ditolak untuk profil Anda. Pastikan Anda login dengan akun yang benar.`);
          } else {
            setError(`Gagal memuat profil. Silakan refresh atau login kembali.`);
          }
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setIsAuthReady(true);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Detailed Login Error:', {
        code: error.code,
        message: error.message,
        customData: error.customData
      });
      if (error.code === 'auth/internal-error') {
        alert('Terjadi kesalahan internal pada Firebase Auth. Pastikan browser Anda mengizinkan pop-up dan cookies pihak ketiga.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, isAuthReady, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
