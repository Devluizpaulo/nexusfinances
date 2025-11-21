'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { DollarSign, Loader2 } from 'lucide-react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleAdminAuth = async (
    userCredential: any
  ) => {
    if (!firestore) return;
    const firebaseUser = userCredential.user;
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data()?.role === 'superadmin') {
        return true;
    } else {
        await auth?.signOut();
        toast({
            variant: 'destructive',
            title: 'Acesso Negado',
            description: 'Esta área é restrita para administradores.',
        });
        return false;
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const isAdmin = await handleAdminAuth(result);
      if (isAdmin) {
        redirect('/admin/dashboard');
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Erro no login com Google:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de Login',
          description: 'Não foi possível fazer login com o Google. Tente novamente.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (values: LoginValues) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const isAdmin = await handleAdminAuth(userCredential);
      if (isAdmin) {
        redirect('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Erro no login com E-mail:', error);
      let description =
        'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
      if (error.code === 'auth/user-not-found') {
        description = 'Administrador não encontrado.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      redirect('/admin/dashboard');
    }
  }, [user]);

  if (isUserLoading || (user && user.role === 'superadmin')) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <DollarSign className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Portal do Administrador
        </h1>
        <p className="mt-2 text-md text-muted-foreground">
          Acesse para gerenciar o Nexus Finanças.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login de Administrador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...loginForm}>
            <form
              onSubmit={loginForm.handleSubmit(handleEmailLogin)}
              className="space-y-4"
            >
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="******"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !auth}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Entrar com Email
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full"
            disabled={isLoading || !auth}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 174.4 58.9L359.7 127.4c-27.8-26.2-63.5-42.6-111.7-42.6-88.5 0-160.9 72.4-160.9 161.2s72.4 161.2 160.9 161.2c38.3 0 71.3-12.8 96.2-34.4 22.1-19.1 33.4-44.9 36.8-74.6H248V261.8h239.2z"
                ></path>
              </svg>
            )}
            Continuar com Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
