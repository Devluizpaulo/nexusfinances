
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { DollarSign, Loader2, Eye, EyeOff } from 'lucide-react';
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
import { motion } from 'framer-motion';
import { PremiumBackground } from '@/components/premium-effects';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRegister, setShowPasswordRegister] = useState(false);
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
  }, [searchParams, loginForm, registerForm, activeTab]);

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
    <div className="relative grid min-h-screen w-full lg:grid-cols-2 overflow-hidden">
      <PremiumBackground />
      
      {/* Left - Form Section */}
      <motion.div 
        className="relative flex items-center justify-center p-6 sm:p-12 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/" className="flex items-center justify-center mb-10 group">
              {/* Logo Container with Glow */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Outer glow */}
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-xl blur-2xl opacity-40 group-hover:opacity-70"
                  animate={{
                    opacity: [0.3, 0.4, 0.3],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                  }}
                />
                <Image 
                    src="/images/xoplanilhas_logo.png" 
                    alt="Logo Xô Planilhas" 
                    width={400} 
                    height={500} 
                    className="h-44 w-50 object-contain relative z-10 drop-shadow-2xl" 
                  />
                
              </motion.div>
            </Link>
            
            <div className="text-center mt-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent mb-3">
                Acesse sua conta
              </h1>
              <p className="text-slate-400 text-base leading-relaxed">
                Entre para assumir o controle da sua vida financeira
              </p>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 mb-6 backdrop-blur-xl">
                <TabsTrigger 
                  value="login"
                  className="rounded-lg font-semibold text-sm py-2.5 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="rounded-lg font-semibold text-sm py-2.5 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-300">Email</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300 -z-10"></div>
                              <Input 
                                type="email" 
                                placeholder="seu@email.com" 
                                {...field}
                                className="h-12 rounded-xl border-2 border-slate-700/50 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30 transition-all backdrop-blur-xl"
                              />
                            </div>
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
                          <FormLabel className="text-sm font-semibold text-slate-300">Senha</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300 -z-10"></div>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                {...field}
                                className="h-12 rounded-xl border-2 border-slate-700/50 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30 transition-all backdrop-blur-xl pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                              >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        type="submit" 
                        className="w-full h-12 rounded-xl font-bold text-base bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg hover:shadow-blue-500/40 transition-all duration-300" 
                        disabled={isLoading || !auth}
                      >
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Entrar com Email
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4 mt-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleEmailRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-300">Nome Completo</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300 -z-10"></div>
                              <Input 
                                placeholder="Seu nome" 
                                {...field}
                                className="h-12 rounded-xl border-2 border-slate-700/50 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30 transition-all backdrop-blur-xl"
                              />
                            </div>
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
                          <FormLabel className="text-sm font-semibold text-slate-300">Email</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300 -z-10"></div>
                              <Input 
                                type="email" 
                                placeholder="seu@email.com" 
                                {...field}
                                className="h-12 rounded-xl border-2 border-slate-700/50 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30 transition-all backdrop-blur-xl"
                              />
                            </div>
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
                          <FormLabel className="text-sm font-semibold text-slate-300">Senha</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300 -z-10"></div>
                              <Input 
                                type={showPasswordRegister ? "text" : "password"} 
                                placeholder="Mínimo 6 caracteres" 
                                {...field}
                                className="h-12 rounded-xl border-2 border-slate-700/50 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30 transition-all backdrop-blur-xl pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswordRegister(!showPasswordRegister)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                              >
                                {showPasswordRegister ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        type="submit" 
                        className="w-full h-12 rounded-xl font-bold text-base bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg hover:shadow-blue-500/40 transition-all duration-300" 
                        disabled={isLoading || !auth}
                      >
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Criar Conta Grátis
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Divider */}
          <motion.div 
            className="relative my-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs uppercase font-semibold text-slate-400">
                Ou continue com
              </span>
            </div>
          </motion.div>

          {/* Google Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleGoogleSignIn}
              className="w-full h-12 rounded-xl font-semibold text-base border-2 border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/50 text-white hover:border-blue-500/50 transition-all duration-300 backdrop-blur-xl"
              disabled={isLoading || !auth}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> :
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 174.4 58.9L359.7 127.4c-27.8-26.2-63.5-42.6-111.7-42.6-88.5 0-160.9 72.4-160.9 161.2s72.4 161.2 160.9 161.2c38.3 0 71.3-12.8 96.2-34.4 22.1-19.1 33.4-44.9 36.8-74.6H248V261.8h239.2z"></path>
                </svg>}
              Continuar com Google
            </Button>
          </motion.div>

          {/* Footer Links */}
          <motion.div 
            className="mt-8 space-y-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <p className="text-xs text-slate-400 leading-relaxed">
              Ao clicar em continuar, você concorda com nossos{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                Política de Privacidade
              </Link>
              .
            </p>

            <div className="text-sm">
              <Link href="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-semibold transition-colors">
                ← Voltar para a página inicial
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right - Image Section */}
      <motion.div 
        className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {loginImage && (
          <>
            <Image
              src={loginImage.imageUrl}
              alt={loginImage.description}
              fill
              className="object-cover opacity-40"
              data-ai-hint={loginImage.imageHint}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          </>
        )}
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col justify-end p-12 z-10">
          <motion.div 
            className="rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-950/60 border border-blue-500/20 backdrop-blur-xl p-8 space-y-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white leading-tight">
              Simples. Visual. Sem estresse.
            </h2>
            <p className="text-slate-300 text-lg">
              &quot;Finalmente uma ferramenta que entende o que eu preciso. Em minutos, todo o meu fluxo financeiro estava organizado.&quot;
            </p>
            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-sm text-slate-400">— Usuário satisfeito do Xô Planilhas</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
