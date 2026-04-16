import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Users, Gamepad2, Info, GraduationCap, LogIn, LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import DirectorySection from './components/DirectorySection';
import GameSection from './components/GameSection';
import AdminSection from './components/AdminSection';
import { motion } from 'motion/react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Badge } from './components/ui/badge';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { GalleryItem, AppSettings } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { user, profile, login, logout, loading, error } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('addedAt', 'desc'));
    const unsubscribeGallery = onSnapshot(q, (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GalleryItem));
      setGallery(galleryData);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    });

    return () => {
      unsubscribeGallery();
      unsubscribeSettings();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Autentikasi</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Halaman
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              Instrumen 25 <span className="text-primary">Bonding</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold">{user.displayName}</div>
                  <Badge variant="outline" className="text-[10px] h-4 uppercase">
                    {profile?.role || 'participant'}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button onClick={login} className="gap-2">
                <LogIn className="h-4 w-4" /> Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} w-full max-w-xl h-12`}>
              <TabsTrigger value="home" className="gap-2">
                <Info className="h-4 w-4" /> Home
              </TabsTrigger>
              <TabsTrigger value="game" className="gap-2">
                <Gamepad2 className="h-4 w-4" /> Game
              </TabsTrigger>
              <TabsTrigger value="directory" className="gap-2">
                <Users className="h-4 w-4" /> Teman
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="home" className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center"
            >
              <div className="lg:col-span-3 space-y-8">
                {user && (
                  <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Akses: {profile?.role}
                  </div>
                )}
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase italic">
                    Instrumen <span className="text-primary">25</span> <br />
                    <span className="text-outline-primary">Satu Jiwa.</span>
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                    Platform eksklusif untuk mempererat ikatan keluarga besar Instrumen 25. 
                    Hafalkan wajah, kenali cerita, dan bangun masa depan bersama.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg"
                    onClick={() => setActiveTab('game')}
                    className="h-16 px-10 text-xl font-black italic uppercase tracking-tight shadow-2xl shadow-primary/30 hover:scale-105 transition-transform"
                  >
                    Mulai Main <Gamepad2 className="ml-2 h-6 w-6" />
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => setActiveTab('directory')}
                    className="h-16 px-10 text-xl font-black italic uppercase tracking-tight border-2 hover:bg-primary/5"
                  >
                    Cari Teman
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-4">
                  <div>
                    <div className="text-3xl font-black text-primary">100%</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Solidaritas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-primary">24/7</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Kekeluargaan</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-primary">∞</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Perjuangan</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 relative group">
                <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-colors duration-500" />
                <Card className="relative border-4 border-primary/10 bg-card/80 backdrop-blur-xl overflow-hidden rounded-3xl shadow-2xl">
                  <div className="aspect-square relative">
                    <img 
                      src={settings?.featuredMemoryUrl || "https://picsum.photos/seed/engineering-team/800/800"} 
                      alt="Instrumen 25 Hero" 
                      className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="text-xs font-bold uppercase tracking-[0.3em] mb-1 opacity-80">Featured Memory</div>
                      <div className="text-2xl font-black italic uppercase leading-none">
                        {settings?.featuredMemoryTitle || "Kebersamaan Adalah Kunci"}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* Gallery Section */}
            <section className="space-y-8 pt-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-primary/10 pb-6">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter">Galeri Perjuangan</h3>
                  <p className="text-muted-foreground">Momen-momen tak terlupakan angkatan Instrumen 25.</p>
                </div>
                <Badge variant="secondary" className="w-fit h-8 px-4 text-sm font-bold uppercase italic">
                  Since 2025
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.length > 0 ? (
                  gallery.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -8 }}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-lg"
                    >
                      <img 
                        src={item.url} 
                        alt={item.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white font-black italic uppercase text-sm tracking-tight">{item.title}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  // Fallback placeholders if gallery is empty
                  [
                    { seed: 'campus-life', title: 'Awal Perjuangan' },
                    { seed: 'study-group', title: 'Belajar Bareng' },
                    { seed: 'celebration', title: 'Momen Bahagia' },
                    { seed: 'sunset-team', title: 'Solidaritas Tanpa Batas' }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -8 }}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-lg"
                    >
                      <img 
                        src={`https://picsum.photos/seed/${item.seed}/600/800`} 
                        alt={item.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white font-black italic uppercase text-sm tracking-tight">{item.title}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* Quote Section */}
            <div className="bg-primary text-primary-foreground p-12 rounded-[3rem] text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 text-9xl font-black">"</div>
                <div className="absolute bottom-10 right-10 text-9xl font-black rotate-180">"</div>
              </div>
              <h4 className="text-2xl md:text-4xl font-black italic uppercase leading-tight max-w-3xl mx-auto relative z-10">
                "Bukan tentang siapa yang paling pintar, tapi tentang siapa yang paling bertahan bersama."
              </h4>
              <p className="text-primary-foreground/80 font-bold tracking-widest uppercase text-sm">
                — Motto Instrumen 25
              </p>
            </div>
          </TabsContent>

          <TabsContent value="game">
            <GameSection />
          </TabsContent>

          <TabsContent value="directory">
            <DirectorySection />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminSection />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center gap-2 items-center text-muted-foreground">
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">Instrumen 25</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Dibuat untuk mempererat tali silaturahmi angkatan.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
