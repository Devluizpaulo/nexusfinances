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
  };
}

export function AICoachChat({ userName, financialData }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: `Olá, **${userName}**! Eu sou o **Xô Planilhas**, seu conselheiro financeiro de bolso. 🧠💰\n\nAnalisei seus dados atuais:\n- **Balanço**: R$ ${financialData.balance.toFixed(2)}\n- **Taxa de Poupança**: ${financialData.savingsRate.toFixed(0)}%\n\nComo posso ajudar você a otimizar sua vida financeira hoje? Escolha uma sugestão abaixo ou digite sua dúvida!`,
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
              className="text-sm text-slate-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card className="relative overflow-hidden border-blue-500/20 bg-slate-900/60 backdrop-blur-xl flex flex-col h-[600px]">
      {/* Glow */}
      <div className="absolute -left-10 -top-10 bg-blue-600/10 rounded-full h-40 w-40 blur-3xl -z-10" />
      <div className="absolute -right-10 -bottom-10 bg-cyan-500/10 rounded-full h-40 w-40 blur-3xl -z-10" />

      {/* Header */}
      <CardHeader className="border-b border-slate-800/80 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base text-white flex items-center gap-1.5">
              Conselheiro Xô Planilhas
              <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Perguntas e respostas orientadas por IA sobre sua saúde financeira.
            </CardDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClearChat}
          className="h-8 w-8 text-slate-400 hover:text-white"
          title="Reiniciar conversa"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      {/* Message List */}
      <CardContent className="flex-1 overflow-hidden p-4">
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
                      <Avatar className="h-8 w-8 border border-blue-500/30">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                        isModel
                          ? "bg-slate-800/80 text-white rounded-tl-none border border-slate-700/30"
                          : "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none"
                      }`}
                    >
                      {renderMessageContent(m.text)}
                      <span className="text-[10px] text-slate-400 block text-right mt-1.5">
                        {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!isModel && (
                      <Avatar className="h-8 w-8 border border-slate-700">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-slate-700 text-slate-300">
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
                <Avatar className="h-8 w-8 border border-blue-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-800/80 text-white rounded-2xl rounded-tl-none border border-slate-700/30 px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  <span className="text-xs text-slate-300">O conselheiro está analisando seus dados...</span>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(sug)}
              className="text-xs bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 rounded-full px-3 py-1.5 transition-colors text-left"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Footer Input */}
      <CardFooter className="border-t border-slate-800/80 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Pergunte ao conselheiro... (Ex: Como economizar R$ 200?)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold shadow-lg shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
