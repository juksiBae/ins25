import React, { useState } from 'react';
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

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { user, profile, login, logout, loading, error } = useAuth();

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

          <TabsContent value="home" className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-6">
                {user && (
                  <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Akses: {profile?.role}
                  </div>
                )}
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight">
                  Kenali Teman <br />
                  <span className="text-primary">Satu Perjuangan.</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Gunakan platform ini untuk menghafal nama, NIM, dan asal teman-teman Instrumen 25. 
                  {profile?.role === 'admin' && " Sebagai Admin, Anda memiliki kontrol penuh atas data dan peran user."}
                  {profile?.role === 'moderator' && " Sebagai Moderator, Anda dapat membantu menambahkan dan mengedit data teman."}
                  {!user && " Login hanya diperlukan bagi Admin atau Moderator untuk mengelola data."}
                </p>
                <div className="flex gap-4">
                  <Button 
                    size="lg"
                    onClick={() => setActiveTab('game')}
                    className="h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    Mulai Main
                  </Button>
                  <Button 
                    size="lg"
                    variant="secondary"
                    onClick={() => setActiveTab('directory')}
                    className="h-14 px-8 text-lg font-bold"
                  >
                    Lihat Teman
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full" />
                <Card className="relative border-2 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>{user ? `Dashboard ${profile?.role}` : 'Statistik Angkatan'}</CardTitle>
                    <CardDescription>{user ? 'Status akses Anda saat ini' : 'Gambaran umum Instrumen 25'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user && (
                      <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                        <UserCircle className="h-10 w-10 text-primary" />
                        <div>
                          <div className="font-bold">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <div className="text-xl font-bold">25144...</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Format NIM</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <div className="text-xl font-bold">100</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Target Data</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
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
