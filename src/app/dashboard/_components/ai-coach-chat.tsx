"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { askAICoach, type AICoachChatInput } from "@/ai/flows/ai-coach-chat-flow";
import { Sparkles, Send, Bot, User, Loader2, RefreshCw, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface AICoachChatProps {
  userName: string;
  financialData: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
    debtCount: number;
    goalCount: number;
    healthScore?: number;
    activeGoals?: { name: string; target: number; current: number }[];
    topExpenses?: { category: string; amount: number; percentage: number }[];
  };
}

export function AICoachChat({ userName, financialData }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: `Olá, **${userName}**! Eu sou o **Xô Planilhas**, seu conselheiro financeiro de bolso. 🧠💰\n\nAnalisei seus dados atuais:\n- **Balanço**: R$ ${financialData.balance.toFixed(2)}\n- **Taxa de Poupança**: ${financialData.savingsRate.toFixed(0)}%${financialData.healthScore !== undefined ? `\n- **Score de Saúde**: ${financialData.healthScore} / 100` : ''}\n\nComo posso ajudar você a otimizar sua vida financeira hoje? Escolha uma sugestão abaixo ou digite sua dúvida!`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Como economizar mais este mês?",
    "Minhas despesas estão saudáveis?",
    "Quais as melhores dicas para sair das dívidas?",
    "Como montar uma reserva de emergência?",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMessage: Message = {
      role: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      // Map history for flow input
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const payload: AICoachChatInput = {
        userName,
        message: textToSend,
        history: historyPayload,
        financialSummary: financialData,
      };

      const result = await askAICoach(payload);

      const aiMessage: Message = {
        role: "model",
        text: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro ao consultar a IA",
        description: "Não conseguimos contato com o conselheiro. Tente novamente.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "model",
        text: `Chat reiniciado! Como posso ajudar você a otimizar suas finanças agora, **${userName}**?`,
        timestamp: new Date(),
      },
    ]);
  };

  // Simple Markdown helper
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          let content = line;
          const isListItem = content.trim().startsWith("-") || content.trim().startsWith("*");
          if (isListItem) {
            content = content.replace(/^[\s-*]+/, "");
          }

          // Bold pattern
          let html = content
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1 py-0.5 rounded text-xs">$1</code>');

          if (isListItem) {
            return (
              <li
                key={idx}
                className="ml-4 list-disc text-sm text-slate-300"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          if (line.trim() === "") {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p
              key={idx}
              className="text-xs text-slate-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="card-premium relative overflow-hidden backdrop-blur-xl flex flex-col h-[520px] hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="border-b border-white/5 pb-3 mb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center text-cyan-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              Conselheiro Xô Planilhas
              <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Perguntas e respostas orientadas por IA sobre sua saúde financeira.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClearChat}
          className="h-8 w-8 text-slate-500 hover:text-slate-200"
          title="Reiniciar conversa"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-hidden px-1 py-2">
        <ScrollArea className="h-full pr-3">
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => {
                const isModel = m.role === "model";
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isModel ? "justify-start" : "justify-end"}`}
                  >
                    {isModel && (
                      <Avatar className="h-8 w-8 border border-white/5">
                        <AvatarFallback className="bg-slate-900/50 text-cyan-400">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md border",
                        isModel
                          ? "bg-slate-900/40 text-slate-200 rounded-tl-none border-white/5"
                          : "bg-slate-900 border-cyan-500/20 text-slate-100 rounded-tr-none"
                      )}
                    >
                      {renderMessageContent(m.text)}
                      <span className="text-[9px] text-slate-500 block text-right mt-1.5">
                        {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!isModel && (
                      <Avatar className="h-8 w-8 border border-white/5">
                        <AvatarFallback className="bg-slate-800 text-slate-300">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <Avatar className="h-8 w-8 border border-white/5">
                  <AvatarFallback className="bg-slate-900/50 text-cyan-400">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-900/40 text-slate-200 rounded-2xl rounded-tl-none border border-white/5 px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  <span className="text-[10px] text-slate-400">O conselheiro está analisando seus dados...</span>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="pb-3 pt-1 flex flex-wrap gap-1.5">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(sug)}
              className="text-[11px] bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 rounded-full px-3 py-1.5 transition-all text-left hover:border-cyan-500/20"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Footer Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="border-t border-white/5 pt-3 flex w-full gap-2"
      >
        <Input
          placeholder="Pergunte ao conselheiro... (Ex: Como economizar R$ 200?)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          className="flex-1 bg-slate-900/40 border-white/5 text-xs text-white placeholder:text-slate-600 h-9"
        />
        <Button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold shadow-md shadow-blue-500/10 shrink-0 h-9 px-4"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
