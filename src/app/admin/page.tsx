'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useFirestore, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';

const adminRegisterSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type RegisterValues = z.infer<typeof adminRegisterSchema>;

export default function AdminPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const handleAdminRegister = async (values: RegisterValues) => {
    if (!auth || !firestore) return;

    // This is a placeholder; in a real app, you'd create a separate auth instance
    // or use a cloud function to register users without signing them in immediately.
    // For this example, we'll just show a toast and log. A real implementation is complex.

    try {
        // NOTE: This approach has a major flaw for this use case:
        // createUserWithEmailAndPassword also signs in the new user in the CURRENT session,
        // which is not what we want for an admin panel.
        // A production-grade solution would use Firebase Admin SDK in a Cloud Function
        // to create users without affecting the admin's session.
        // We are simulating the creation locally for demonstration purposes.
        
        // This is a local simulation. It won't actually create a user in your main project's auth.
        // To properly implement this, you would need a backend endpoint (Cloud Function)
        // that uses the Firebase Admin SDK.
         toast({
            title: 'Simulação de Criação de Admin',
            description: `Em um ambiente de produção, uma Cloud Function seria chamada para criar o usuário ${values.email} com a role de superadmin.`,
        });

        console.log("Simulating Super Admin Creation:", {
            email: values.email,
            name: values.name,
            role: 'superadmin'
        });

        // Here is how you WOULD save the user data to Firestore if the user was created.
        // const newUserId = "some-user-id-from-admin-sdk";
        // const userDocRef = doc(firestore, 'users', newUserId);
        // await setDoc(userDocRef, {
        //     id: newUserId,
        //     displayName: values.name,
        //     email: values.email,
        //     registrationDate: serverTimestamp(),
        //     role: 'superadmin',
        // });

        registerForm.reset();

    } catch (error: any) {
        console.error('Erro no cadastro de Admin:', error);
        toast({
            variant: "destructive",
            title: "Erro no Cadastro",
            description: "Não foi possível criar a conta de administrador.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  // Redirect if not a superadmin
  if (user && user.role !== 'superadmin') {
    toast({
        variant: "destructive",
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
    });
    return redirect('/dashboard');
  }

  return (
    <>
      <PageHeader
        title="Painel do Super Administrador"
        description="Gerenciar administradores do sistema."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Cadastrar Novo Super Admin</CardTitle>
          <CardDescription>
            Este formulário (simulado) criaria um novo usuário com privilégios de super
            administrador. Em produção, use uma Cloud Function.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...registerForm}>
            <form
              onSubmit={registerForm.handleSubmit(handleAdminRegister)}
              className="space-y-4"
            >
              <FormField
                control={registerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do admin" {...field} />
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
                control={registerForm.control}
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
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !auth}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Super Admin (Simulação)
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
