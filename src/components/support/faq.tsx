import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

const faqItems = [
    {
        question: "Como funcionam as transações recorrentes?",
        answer: "Ao criar uma renda ou despesa, você pode marcá-la como 'Recorrente'. O sistema usará essa transação como um modelo e criará automaticamente uma cópia dela todos os meses. Isso é útil para salários, aluguéis e assinaturas. Apenas o primeiro lançamento precisa ser manual; os demais serão gerados no início de cada mês."
    },
    {
        question: "O que significa o 'Balanço Geral' no painel?",
        answer: "O 'Balanço Geral' representa o seu saldo acumulado desde que você começou a usar o aplicativo. Ele é calculado somando todas as suas rendas e subtraindo todas as suas despesas, independentemente do mês. Ele oferece uma visão clara do seu patrimônio líquido total."
    },
    {
        question: "Como faço para pagar a parcela de uma dívida?",
        answer: "Vá para a página 'Dívidas' e encontre o card da dívida desejada. Clique em 'Ver Parcelas' para expandir a lista. Ao lado de cada parcela pendente, haverá um botão 'Pagar'. Clicar nele marcará a parcela como paga e atualizará o valor total pago da dívida."
    },
    {
        question: "Como os 'Insights Financeiros' com IA funcionam?",
        answer: "Na página do painel, clique em 'Gerar Insights'. O sistema enviará seus dados financeiros do mês selecionado (renda, despesas, dívidas, etc.) de forma anônima para um modelo de inteligência artificial, que fornecerá um resumo e recomendações personalizadas para te ajudar a entender melhor suas finanças."
    },
    {
        question: "Posso alterar minha senha se me cadastrei com o Google?",
        answer: "Não. Se você se cadastrou usando sua conta do Google, sua autenticação é gerenciada diretamente pelo Google. Para alterar sua senha, você deve fazê-lo através das configurações de segurança da sua própria conta Google. A opção de alterar senha no perfil do Xô Planilhas funciona apenas para contas criadas com e-mail e senha."
    },
];


export function Faq() {
  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
                    <CardDescription>Encontre respostas rápidas para as dúvidas mais comuns.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
             <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>
                           {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
    </Card>
  )
}
