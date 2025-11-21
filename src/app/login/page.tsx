'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { DollarSign, Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error('Erro no login com Google:', error);
    }
  };

  useEffect(() => {
    if (user) {
      redirect('/dashboard');
    }
  }, [user]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <DollarSign className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Bem-vindo ao Nexus Finanças
        </h1>
        <p className="text-lg text-muted-foreground">
          Seu assistente pessoal para uma vida financeira mais organizada e inteligente.
        </p>
        <Button
          onClick={handleGoogleSignIn}
          size="lg"
          className="w-full max-w-xs"
          disabled={!auth}
        >
          <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 174.4 58.9L359.7 127.4c-27.8-26.2-63.5-42.6-111.7-42.6-88.5 0-160.9 72.4-160.9 161.2s72.4 161.2 160.9 161.2c38.3 0 71.3-12.8 96.2-34.4 22.1-19.1 33.4-44.9 36.8-74.6H248V261.8h239.2z"></path>
          </svg>
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}
