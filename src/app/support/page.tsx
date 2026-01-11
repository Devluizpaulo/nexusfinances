'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  BookOpen, 
  Headphones,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Star,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Faq } from '@/components/support/faq';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const contactChannels = [
  {
    id: 'form',
    icon: MessageSquare,
    title: 'Formulário de Contato',
    description: 'A forma mais direta de nos contatar.',
    availability: 'Responderemos em até 48h úteis',
    color: 'from-blue-500 to-cyan-500',
    action: 'Preencher Formulário',
    href: '#contact-form',
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email',
    description: 'Para questões detalhadas.',
    availability: 'contato@xoplanilhas.com',
    color: 'from-purple-500 to-pink-500',
    action: 'Enviar Email',
    href: 'mailto:contato@xoplanilhas.com',

  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Ajuda Rápida',
    description: 'Encontre respostas imediatas.',
    availability: 'Acesso 24/7',
    color: 'from-orange-500 to-red-500',
    action: 'Ver Perguntas Frequentes',
    href: '#faq',
  },
];

const supportStats = [
  {
    icon: Clock,
    label: 'Tempo Médio',
    value: '< 48h',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Star,
    label: 'Satisfação',
    value: '98%',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: CheckCircle2,
    label: 'Resolvidos',
    value: '1.2k+',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Users,
    label: 'Atendimentos',
    value: '5k+',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

export default function SupportPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: 'Mensagem enviada com sucesso! 🎉',
      description: 'Nossa equipe entrará em contato em breve.',
    });

    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleChannelClick = (href: string) => {
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-8 md:p-12"
      >
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 shadow-lg shadow-primary/30"
          >
            <Headphones className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-4 text-4xl font-bold tracking-tight md:text-5xl"
          >
            Como podemos{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ajudar?
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="max-w-2xl text-lg text-muted-foreground"
          >
            Nossa equipe está sempre pronta para te ajudar. Escolha o canal que preferir e receba suporte especializado.
          </motion.p>
          
          {/* Support Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {supportStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-4 backdrop-blur-sm"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Contact Channels */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contactChannels.map((channel, index) => (
          <motion.div
            key={channel.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <Card className="relative h-full overflow-hidden border-primary/20 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${channel.color}`} />
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${channel.color} shadow-lg`}>
                    <channel.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg">{channel.title}</CardTitle>
                  <CardDescription className="mt-1">{channel.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{channel.availability}</span>
                </div>
                <Button className="w-full" variant="outline" onClick={() => handleChannelClick(channel.href)}>
                  {channel.action}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Contact Form & Quick Tips */}
      <div id="contact-form" className="grid gap-8 lg:grid-cols-3">
        {/* Contact Form - 2 columns */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/30">
                  <Send className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Envie sua Mensagem</CardTitle>
                  <CardDescription>
                    Descreva sua dúvida ou problema e retornaremos em breve
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      Nome Completo
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      defaultValue={user?.displayName || ''} 
                      required
                      placeholder="Seu nome"
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      Email
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={user?.email || ''} 
                      required
                      placeholder="seu@email.com"
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    Categoria
                    <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="bug">🐛 Reportar Bug</option>
                    <option value="feature">💡 Sugerir Funcionalidade</option>
                    <option value="help">❓ Preciso de Ajuda</option>
                    <option value="account">👤 Questões de Conta</option>
                    <option value="billing">💳 Pagamento/Assinatura</option>
                    <option value="other">📝 Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="flex items-center gap-2">
                    Assunto
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="subject" 
                    placeholder="Resuma seu problema ou dúvida" 
                    required
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="flex items-center gap-2">
                    Mensagem
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea 
                    id="message" 
                    placeholder="Descreva seu problema ou dúvida em detalhes... Quanto mais informações você fornecer, mais rápido poderemos ajudar!" 
                    className="min-h-[150px] transition-all focus:ring-2 focus:ring-primary/20" 
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dica: Inclua capturas de tela ou informações técnicas se relevante
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Responderemos em até 48 horas úteis</span>
                  </div>
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Tips - 1 column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Dicas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <TrendingUp className="h-5 w-5 shrink-0 text-blue-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Verifique o FAQ primeiro</p>
                    <p className="text-xs text-muted-foreground">
                      Muitas dúvidas comuns já têm resposta rápida
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                  <BookOpen className="h-5 w-5 shrink-0 text-purple-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Consulte a documentação</p>
                    <p className="text-xs text-muted-foreground">
                      Guias detalhados sobre todas as funcionalidades
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <MessageSquare className="h-5 w-5 shrink-0 text-green-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seja detalhista no formulário</p>
                    <p className="text-xs text-muted-foreground">
                      Quanto mais detalhes, mais rápido resolvemos
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <motion.div
        id="faq"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Faq />
      </motion.div>
    </div>
  );
}
