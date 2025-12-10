

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { DollarSign, Loader2 } from 'lucide-react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { redirect, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, 
} from '@/components/ui/card';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;


export default function LoginPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return <LoginClient />;
}

function LoginClient() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  // Pre-fill email from URL param
  useEffect(() => {
    const emailFromParams = searchParams.get('email');
    if (emailFromParams) {
      if (activeTab === 'login') {
        loginForm.setValue('email', emailFromParams);
      } else {
        registerForm.setValue('email', emailFromParams);
      }
      setActiveTab('register'); // Default to register tab if email is present
    }
  }, [searchParams, loginForm, registerForm]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener in FirebaseProvider will handle user doc creation/check
    } catch (error: any) {
      // Only show a toast if the error is not the user closing the popup
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Erro no login com Google:', error);
        toast({
          variant: "destructive",
          title: "Erro de Login",
          description: "Não foi possível fazer login com o Google. Tente novamente."
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
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // The onAuthStateChanged listener in FirebaseProvider will handle user state
    } catch (error: any) {
      console.error('Erro no login com E-mail:', error);
       const authErrors = [
          'auth/invalid-credential',
          'auth/wrong-password',
          'auth/invalid-email',
          'auth/user-disabled',
        ];

      if (error.code === 'auth/user-not-found') {
        toast({
          variant: "destructive",
          title: "Usuário não encontrado",
          description: "Que tal se cadastrar?",
        });
        setActiveTab('register');
        registerForm.setValue('email', values.email);
      } else if (authErrors.includes(error.code)) {
         toast({
          variant: "destructive",
          title: "Erro de Login",
          description: "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
        });
      } else {
         toast({
          variant: "destructive",
          title: "Erro de Login",
          description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        });
      }
    } finally {
        setIsLoading(false);
    }
  };

  const handleEmailRegister = async (values: RegisterValues) => {
      if (!auth) return;
      setIsLoading(true);
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          
          await updateProfile(userCredential.user, {
              displayName: values.name,
          });
          
          toast({
              title: "Cadastro realizado com sucesso!",
              description: "Redirecionando para o seu painel..."
          });

      } catch (error: any) {
          console.error('Erro no cadastro com E-mail:', error);
          let description = "Não foi possível criar sua conta. Tente novamente.";
          if (error.code === 'auth/email-already-in-use') {
            description = "Este e-mail já está em uso. Tente fazer login.";
            setActiveTab('login');
            loginForm.setValue('email', values.email);
          }
           toast({
              variant: "destructive",
              title: "Erro no Cadastro",
              description,
          });
      } finally {
          setIsLoading(false);
      }
  };


  useEffect(() => {
    if (user) {
      redirect('/dashboard');
    }
  }, [user]);
  
  const loginImage = PlaceHolderImages.find(p => p.id === 'lp-hero');

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <Link href="/" className="flex items-center justify-center gap-2 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg">
                  <Image src="/images/xoplanilhas_logo.png" alt="Logo Xô Planilhas" width={48} height={48} />
                </div>
                <span className="text-2xl font-bold tracking-tight">Xô Planilhas</span>
            </Link>
            <h1 className="text-3xl font-bold">Acesse sua conta</h1>
            <p className="text-balance text-muted-foreground">
              Entre para assumir o controle da sua vida financeira.
            </p>
          </div>
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
               <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
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
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading || !auth}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar com Email
                    </Button>
                  </form>
                </Form>
            </TabsContent>
             <TabsContent value="register" className="mt-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleEmailRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading || !auth}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar Conta Grátis
                    </Button>
                  </form>
                </Form>
             </TabsContent>
          </Tabs>
           <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
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
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 174.4 58.9L359.7 127.4c-27.8-26.2-63.5-42.6-111.7-42.6-88.5 0-160.9 72.4-160.9 161.2s72.4 161.2 160.9 161.2c38.3 0 71.3-12.8 96.2-34.4 22.1-19.1 33.4-44.9 36.8-74.6H248V261.8h239.2z"></path>
              </svg>}
            Continuar com Google
          </Button>

          <p className="mt-4 px-8 text-center text-xs text-muted-foreground">
            Ao clicar em continuar, você concorda com nossos{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Política de Privacidade
            </Link>
            .
          </p>

          <div className="mt-4 text-center text-sm">
            <Link href="/" className="underline underline-offset-2">
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginImage && (
            <Image
                src={loginImage.imageUrl}
                alt={loginImage.description}
                fill
                className="object-cover"
                data-ai-hint={loginImage.imageHint}
                priority
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-primary/5"></div>
         <div className="relative flex h-full flex-col justify-end p-10 text-primary-foreground">
            <div className="z-10 rounded-lg bg-black/30 p-6 backdrop-blur-sm">
                <h2 className="text-3xl font-bold">Simples. Visual. Sem estresse.</h2>
                <p className="mt-2 text-primary-foreground/80">"Finalmente uma ferramenta que entende o que eu preciso. Em minutos, todo o meu fluxo financeiro estava organizado."</p>
            </div>
        </div>
      </div>
    </div>
  );
}
