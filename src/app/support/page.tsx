'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { MessageSquare } from 'lucide-react';
import { Faq } from '@/components/support/faq';

export default function SupportPage() {
  const { user } = useUser();

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enviar uma Mensagem</CardTitle>
            <CardDescription>Nossa equipe responderá o mais breve possível.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" defaultValue={user?.displayName || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" placeholder="Sobre o que você gostaria de falar?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea id="message" placeholder="Descreva seu problema ou dúvida em detalhes..." className="min-h-[120px]" />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Enviar Mensagem</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
            <CardDescription>Outras formas de entrar em contato.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 rounded-md border p-4">
              <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold">Chat ao Vivo</h3>
                <p className="text-sm text-muted-foreground">Disponível de segunda a sexta, das 9h às 18h.</p>
                <Button variant="outline" className="mt-2">Iniciar Chat</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Faq />
      </div>
    </>
  );
}
