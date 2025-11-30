

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useAuth, useFirestore, useStorage } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Link as LinkIcon, Lock, Banknote, Star } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { incomeCategories, expenseCategories } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const profileFormSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  phoneNumber: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As novas senhas não coincidem.',
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormValues | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user || !firestore || !auth.currentUser) return;

    const { firstName, lastName } = values;
    const displayName = `${firstName} ${lastName}`.trim();
    
    try {
      await updateProfile(auth.currentUser, { displayName });
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { ...values, displayName });

      toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Formato de arquivo inválido', description: 'Por favor, selecione um arquivo JPG, PNG ou GIF.' });
      return;
    }
     if (file.size > 1 * 1024 * 1024) { // 1MB limit
      toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'A imagem deve ter no máximo 1MB.' });
      return;
    }

    setIsUploading(true);
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);

    try {
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { photoURL });
      
      toast({ title: 'Foto de perfil atualizada!', description: 'Sua nova foto já está visível.' });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({ variant: 'destructive', title: 'Erro no upload', description: 'Não foi possível salvar sua foto de perfil. Tente novamente.' });
    } finally {
      setIsUploading(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
     if (!user || !user.email) return;

    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
    if (isGoogleUser) {
        toast({ variant: "destructive", title: "Ação não permitida", description: "Você não pode alterar a senha de uma conta logada com o Google." });
        return;
    }
     
    setPasswordFormData(values);
    setIsPasswordDialogOpen(true);
  };
  
  const handleConfirmPasswordChange = async () => {
    if (!auth || !auth.currentUser || !auth.currentUser.email || !passwordFormData) return;
    
    setIsPasswordDialogOpen(false);
    
    try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, passwordFormData.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, passwordFormData.newPassword);
        
        toast({ title: "Senha alterada!", description: "Sua senha foi atualizada com sucesso." });
        passwordForm.reset();

    } catch (error: any) {
        let description = 'Ocorreu um erro ao alterar sua senha.';
        if (error.code === 'auth/wrong-password') {
            description = 'A senha atual está incorreta. Tente novamente.';
        }
        console.error("Password change error:", error);
        toast({ variant: "destructive", title: "Erro ao alterar senha", description });
    }
    setPasswordFormData(null);
  }

  const handleAddCategory = async (type: 'income' | 'expense') => {
    const category = type === 'income' ? newIncomeCategory : newExpenseCategory;
    if (!user || !firestore || !category.trim()) return;

    const fieldToUpdate = type === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        [fieldToUpdate]: arrayUnion(category.trim())
      });
      toast({ title: 'Categoria Adicionada!', description: `"${category.trim()}" foi adicionada.` });
      if (type === 'income') setNewIncomeCategory('');
      else setNewExpenseCategory('');
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar a categoria." });
    }
  };

  const handleRemoveCategory = async (type: 'income' | 'expense', category: string) => {
    if (!user || !firestore) return;

    const fieldToUpdate = type === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        [fieldToUpdate]: arrayRemove(category)
      });
      toast({ title: 'Categoria Removida!', description: `"${category}" foi removida.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover a categoria." });
    }
  };


  if (isUserLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isGoogleUser = user?.providerData.some(provider => provider.providerId === 'google.com');

  return (
    <>
       <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de Segurança</AlertDialogTitle>
            <AlertDialogDescription>
              Para sua segurança, por favor, confirme sua senha atual para prosseguir com a alteração.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPasswordFormData(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPasswordChange}>
              Confirmar e Alterar Senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Estes são os detalhes da sua conta.</CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 text-primary">
                      <AvatarFallback className="flex h-full w-full items-center justify-center">
                        {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground mt-2">Esta imagem é gerada automaticamente pela inicial do seu nome.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={user?.email || ''} readOnly disabled />
                    </div>
                     <FormField
                      control={profileForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Celular</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" placeholder="(00) 00000-0000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                     {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </CardContent>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
           <Card>
            <CardHeader>
              <CardTitle>Gerenciar Assinatura</CardTitle>
              <CardDescription>Visualize o status do seu plano e gerencie sua assinatura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-6 flex flex-col items-center text-center">
                 <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Seu plano atual</p>
                  <p className="text-2xl font-bold">{user?.subscriptionPlan?.name || 'Gratuito'}</p>
                   {user?.subscription?.status === 'active' && (
                     <Badge className="mt-1 bg-green-100 text-green-800">Ativo</Badge>
                   )}
              </div>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" asChild>
                    <a href="https://www.mercadopago.com.br/subscriptions" target="_blank" rel="noopener noreferrer">Gerenciar no Mercado Pago</a>
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Altere sua senha de acesso.</CardDescription>
               {isGoogleUser && (
                  <p className="!mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Você está logado com o Google. A alteração de senha deve ser feita através da sua conta Google.
                  </p>
              )}
            </CardHeader>
             <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} disabled={isGoogleUser || passwordForm.formState.isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} disabled={isGoogleUser || passwordForm.formState.isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} disabled={isGoogleUser || passwordForm.formState.isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Button type="submit" disabled={isGoogleUser || passwordForm.formState.isSubmitting}>
                      {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Alterar Senha
                  </Button>
                </CardContent>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
