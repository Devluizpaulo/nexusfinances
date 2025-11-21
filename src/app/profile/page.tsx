'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useAuth, useFirestore, useStorage } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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


const profileFormSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  phoneNumber: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: z.string().regex(/^\d{6}$/, 'A nova senha deve conter exatamente 6 dígitos numéricos.'),
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

      <PageHeader title="Perfil & Configuração" description="Gerencie suas informações de conta e preferências." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>Estes são os detalhes da sua conta.</CardDescription>
          </CardHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" hidden/>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Mudar foto
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">JPG, GIF ou PNG. 1MB max.</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Categorias</CardTitle>
            <CardDescription>Adicione ou remova categorias de renda e despesa.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-medium">Categorias de Renda</h3>
              <div className="flex items-center gap-2">
                <Input value={newIncomeCategory} onChange={(e) => setNewIncomeCategory(e.target.value)} placeholder="Nova categoria de renda" />
                <Button onClick={() => handleAddCategory('income')} size="icon" disabled={!newIncomeCategory.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Categorias Padrão</p>
                <div className="flex flex-wrap gap-2">
                  {incomeCategories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                </div>
              </div>
              <Separator />
               <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Suas Categorias</p>
                <div className="flex flex-wrap gap-2">
                  {user?.customIncomeCategories?.map(cat => (
                    <Badge key={cat} variant="outline" className="group">
                      {cat}
                      <button onClick={() => handleRemoveCategory('income', cat)} className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(user?.customIncomeCategories?.length || 0) === 0 && <p className="text-xs text-muted-foreground">Nenhuma categoria personalizada.</p>}
                </div>
              </div>
            </div>
             <div className="space-y-4">
              <h3 className="font-medium">Categorias de Despesa</h3>
               <div className="flex items-center gap-2">
                <Input value={newExpenseCategory} onChange={(e) => setNewExpenseCategory(e.target.value)} placeholder="Nova categoria de despesa" />
                <Button onClick={() => handleAddCategory('expense')} size="icon" disabled={!newExpenseCategory.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Categorias Padrão</p>
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                </div>
              </div>
              <Separator />
               <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Suas Categorias</p>
                <div className="flex flex-wrap gap-2">
                  {user?.customExpenseCategories?.map(cat => (
                    <Badge key={cat} variant="outline" className="group">
                      {cat}
                       <button onClick={() => handleRemoveCategory('expense', cat)} className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                   {(user?.customExpenseCategories?.length || 0) === 0 && <p className="text-xs text-muted-foreground">Nenhuma categoria personalizada.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Altere sua senha.</CardDescription>
             {isGoogleUser && (
                <p className="pt-2 text-sm text-muted-foreground">
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
                        <Input type="password" {...field} disabled={isGoogleUser || passwordForm.formState.isSubmitting} maxLength={6} />
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
                        <Input type="password" {...field} disabled={isGoogleUser || passwordForm.formState.isSubmitting} maxLength={6} />
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
      </div>
    </>
  );
}
