'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  Target,
  Shield,
  Settings,
  Sparkles,
  ChevronDown
} from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion';

const faqCategories = [
  { id: 'all', label: 'Todas', icon: BookOpen },
  { id: 'basics', label: 'Básico', icon: HelpCircle },
  { id: 'transactions', label: 'Transações', icon: CreditCard },
  { id: 'features', label: 'Funcionalidades', icon: Sparkles },
  { id: 'account', label: 'Conta', icon: Shield },
];

const faqItems = [
    {
        question: "Como funcionam as transações recorrentes?",
        answer: "Ao criar uma renda ou despesa, você pode marcá-la como 'Recorrente'. O sistema usará essa transação como um modelo e criará automaticamente uma cópia dela todos os meses. Isso é útil para salários, aluguéis e assinaturas. Apenas o primeiro lançamento precisa ser manual; os demais serão gerados no início de cada mês.",
        category: 'transactions',
        tags: ['recorrência', 'automático', 'mensal']
    },
    {
        question: "O que significa o 'Balanço Geral' no painel?",
        answer: "O 'Balanço Geral' representa o seu saldo acumulado desde que você começou a usar o aplicativo. Ele é calculado somando todas as suas rendas e subtraindo todas as suas despesas, independentemente do mês. Ele oferece uma visão clara do seu patrimônio líquido total.",
        category: 'basics',
        tags: ['balanço', 'dashboard', 'saldo']
    },
    {
        question: "Como faço para pagar a parcela de uma dívida?",
        answer: "Vá para a página 'Dívidas' e encontre o card da dívida desejada. Clique em 'Ver Parcelas' para expandir a lista. Ao lado de cada parcela pendente, haverá um botão 'Pagar'. Clicar nele marcará a parcela como paga e atualizará o valor total pago da dívida.",
        category: 'transactions',
        tags: ['dívida', 'parcela', 'pagamento']
    },
    {
        question: "Como os 'Insights Financeiros' com IA funcionam?",
        answer: "Na página do painel, clique em 'Gerar Insights'. O sistema enviará seus dados financeiros do mês selecionado (renda, despesas, dívidas, etc.) de forma anônima para um modelo de inteligência artificial, que fornecerá um resumo e recomendações personalizadas para te ajudar a entender melhor suas finanças.",
        category: 'features',
        tags: ['IA', 'insights', 'análise', 'recomendações']
    },
    {
        question: "Posso alterar minha senha se me cadastrei com o Google?",
        answer: "Não. Se você se cadastrou usando sua conta do Google, sua autenticação é gerenciada diretamente pelo Google. Para alterar sua senha, você deve fazê-lo através das configurações de segurança da sua própria conta Google. A opção de alterar senha no perfil do Xô Planilhas funciona apenas para contas criadas com e-mail e senha.",
        category: 'account',
        tags: ['senha', 'google', 'autenticação']
    },
    {
        question: "Como configurar notificações de vencimento?",
        answer: "O sistema envia notificações automáticas 3 dias antes de vencimentos importantes, incluindo faturas de cartão de crédito, parcelas de dívidas e metas de economia. Você pode visualizar todas as notificações clicando no ícone de sino no canto superior direito do aplicativo.",
        category: 'features',
        tags: ['notificações', 'vencimento', 'alertas']
    },
    {
        question: "Como funcionam os orçamentos?",
        answer: "Orçamentos permitem definir limites de gastos por categoria. O sistema monitora seus gastos em tempo real e envia alertas quando você atinge 80% e 100% do limite definido. Isso ajuda a manter o controle financeiro e evitar gastos excessivos.",
        category: 'features',
        tags: ['orçamento', 'limite', 'categoria']
    },
    {
        question: "Posso importar dados de outro aplicativo?",
        answer: "Atualmente, o sistema suporta importação de dados via CSV. Você pode exportar seus dados do aplicativo anterior em formato CSV e importá-los através da página de configurações. Certifique-se de que o arquivo CSV está no formato correto antes de importar.",
        category: 'basics',
        tags: ['importar', 'CSV', 'migração']
    },
    {
        question: "Como funciona o desafio das 52 semanas?",
        answer: "O desafio das 52 semanas é um método de economia progressiva onde você economiza um valor crescente a cada semana. Na primeira semana R$ 1, na segunda R$ 2, e assim por diante. Ao final de 52 semanas, você terá economizado R$ 1.378! O sistema te ajuda a acompanhar seu progresso semanalmente.",
        category: 'features',
        tags: ['desafio', '52 semanas', 'economia', 'poupança']
    },
    {
        question: "Meus dados estão seguros?",
        answer: "Sim! Utilizamos o Firebase (Google Cloud) como infraestrutura, com criptografia de ponta a ponta. Seus dados financeiros são armazenados de forma segura e nunca são compartilhados com terceiros. Além disso, implementamos autenticação de dois fatores para maior segurança.",
        category: 'account',
        tags: ['segurança', 'privacidade', 'dados', 'criptografia']
    },
];

export function Faq() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredItems = faqItems.filter(item => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="border-primary/20">
        <CardHeader className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/30">
                        <HelpCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Perguntas Frequentes</CardTitle>
                        <CardDescription>Encontre respostas rápidas para as dúvidas mais comuns</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="w-fit border-primary/50 bg-primary/10 text-primary">
                  {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
                </Badge>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Busque por palavras-chave, categorias ou assuntos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                />
                {searchTerm && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 h-7 -translate-y-1/2 px-2"
                        onClick={() => setSearchTerm('')}
                    >
                        Limpar
                    </Button>
                )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
                {faqCategories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                        <Button
                            key={category.id}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.id)}
                            className={`transition-all ${
                                isActive 
                                    ? 'bg-gradient-to-r from-primary via-purple-500 to-pink-500 shadow-lg shadow-primary/30' 
                                    : 'hover:border-primary/50'
                            }`}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            {category.label}
                        </Button>
                    );
                })}
            </div>
        </CardHeader>
        <CardContent>
            <AnimatePresence mode="wait">
                {filteredItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">Nenhum resultado encontrado</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Tente usar outras palavras-chave ou categorias
                        </p>
                        <Button variant="outline" onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('all');
                        }}>
                            Limpar Filtros
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
                            {filteredItems.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <AccordionItem value={`item-${index}`} className="border-primary/10">
                                        <AccordionTrigger className="hover:text-primary hover:no-underline">
                                            <div className="flex items-start gap-3 text-left">
                                                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                    <HelpCircle className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium">{item.question}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            <div className="space-y-4 pl-9">
                                                <p>{item.answer}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.tags.map((tag, tagIndex) => (
                                                        <Badge 
                                                            key={tagIndex} 
                                                            variant="secondary" 
                                                            className="text-xs"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                            ))}
                        </Accordion>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Help Footer */}
            {filteredItems.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 p-6 text-center"
                >
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <h3 className="mb-2 text-lg font-semibold">Ainda tem dúvidas?</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Nossa equipe está pronta para ajudar com qualquer questão
                    </p>
                    <Button className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 shadow-lg shadow-primary/30">
                        Entrar em Contato
                    </Button>
                </motion.div>
            )}
        </CardContent>
    </Card>
  )
}
