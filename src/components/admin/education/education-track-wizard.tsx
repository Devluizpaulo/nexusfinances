"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, useFieldArray, Controller, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, PlusCircle, Trash2, Sparkles, CheckCircle2, Lock, Zap, Palette, BookOpen, Settings2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateEducationTrack, type GenerateTrackOutput } from "@/ai/flows/generate-education-track-flow";
import { ColorPicker, EDUCATION_THEMES, type ColorTheme } from "./color-picker";
import { TrackPreview } from "./track-preview";
import { TrackStatistics } from "./track-statistics";
import { StepContainer } from "./animations";
import { ProgressIndicator } from "./progress-indicator";

const pointSchema = z.object({
  title: z.string().min(1, "Título do ponto é obrigatório."),
  details: z.string().min(1, "Detalhes são obrigatórios."),
});

const experienceSchema = z.object({
  title: z.string().min(1, "Título da experiência é obrigatório."),
  description: z.string().min(1, "Descrição é obrigatória."),
  details: z.string().min(1, "Detalhes são obrigatórios."),
});

const questionSchema = z.object({
  question: z.string().min(1, "A pergunta é obrigatória."),
  options: z.array(z.object({ text: z.string().min(1, "Opção não pode estar vazia.") })).min(2, "Mínimo de 2 opções."),
  correctAnswer: z.string().min(1, "Selecione a resposta correta."),
});

const moduleSchema = z.object({
  type: z.enum([
    "psychology",
    "practicalExperiences",
    "microHabits",
    "narrative",
    "finalQuiz",
    "tool",
  ]),
  title: z.string().min(1, "Título do módulo é obrigatório."),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  points: z.array(pointSchema).optional(),
  experiences: z.array(experienceSchema).optional(),
  habits: z.array(z.object({ text: z.string().min(1, "Hábito não pode estar vazio.") })).optional(),
  questions: z.array(questionSchema).optional(),
  componentName: z.string().optional(),
});

const trackSchema = z.object({
  title: z.string().min(1, "Título da trilha é obrigatório."),
  slug: z.string().min(1, "Slug é obrigatório.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hifens."),
  description: z.string().min(1, "Descrição é obrigatória."),
  icon: z.string().min(1, "Ícone é obrigatório."),
  bgColor: z.string().default("bg-slate-50"),
  borderColor: z.string().default("border-slate-200"),
  color: z.string().default("text-slate-700"),
  order: z.coerce.number().int().nonnegative().default(0),
  introduction: z.string().min(1, "Introdução é obrigatória."),
  modules: z.array(moduleSchema).min(1, "Adicione pelo menos um módulo."),
});

export type TrackFormValues = z.infer<typeof trackSchema>;

interface EducationTrackWizardProps {
  initialValues?: Partial<TrackFormValues>;
  onSaved?: () => void;
  onCancel?: () => void;
}

type WizardStep = "ai" | "basic" | "appearance" | "introduction" | "modules" | "review";

const LUCIDE_COMMON_ICONS = [
  "Compass",
  "TrendingUp",
  "PiggyBank",
  "BookOpen",
  "Zap",
  "Target",
  "DollarSign",
  "BarChart3",
  "Briefcase",
  "LightbulbIcon",
  "Rocket",
  "Award",
  "HeartHandshake",
  "Brain",
  "Layers",
  "Gem",
];

export function EducationTrackWizard({ initialValues, onSaved, onCancel }: EducationTrackWizardProps) {
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [currentStep, setCurrentStep] = useState<WizardStep>("ai");
  const { toast } = useToast();

  const form = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: initialValues ?? {
      title: "",
      slug: "",
      description: "",
      icon: "Compass",
      bgColor: "bg-slate-100 dark:bg-slate-800",
      borderColor: "border-slate-200 dark:border-slate-700",
      color: "text-slate-600 dark:text-slate-300",
      order: 0,
      introduction: "",
      modules: [],
    },
    mode: "onChange",
  });

  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({ variant: "destructive", title: "Tópico Vazio", description: "Por favor, insira um tema para a geração com IA." });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateEducationTrack({ topic: aiTopic });
      if (result) {
        const formValues: TrackFormValues = {
          ...result,
          modules: result.modules.map(m => ({
            ...m,
            habits: m.habits?.map(h => ({ text: h })) ?? [],
            questions: m.questions?.map(q => ({
              ...q,
              options: q.options.map(o => ({ text: o }))
            })) ?? []
          })),
          order: form.getValues('order'),
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          color: "text-blue-600 dark:text-blue-400",
        };
        form.reset(formValues);
        toast({ title: "🎉 Conteúdo Gerado!", description: "Vamos revisar e ajustar nos próximos passos!" });
        setCurrentStep("basic");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro na Geração", description: err.message || "Não foi possível gerar o conteúdo." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSlug = () => {
    const title = form.getValues("title");
    if (!title) return;
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    form.setValue("slug", slug, { shouldValidate: true });
  };

  const steps: { id: WizardStep; label: string; icon: React.ReactNode; description: string }[] = [
    { id: "ai", label: "IA", icon: <Sparkles className="h-4 w-4" />, description: "Gere com IA" },
    { id: "basic", label: "Básico", icon: <BookOpen className="h-4 w-4" />, description: "Info. básicas" },
    { id: "appearance", label: "Aparência", icon: <Palette className="h-4 w-4" />, description: "Design" },
    { id: "introduction", label: "Introdução", icon: <Zap className="h-4 w-4" />, description: "Conteúdo" },
    { id: "modules", label: "Módulos", icon: <Settings2 className="h-4 w-4" />, description: "Estrutura" },
    { id: "review", label: "Revisar", icon: <CheckCircle2 className="h-4 w-4" />, description: "Finalizar" },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const onSubmit = async (values: TrackFormValues) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const dbModules = values.modules.map(m => ({
        ...m,
        habits: m.habits?.map(h => h.text),
        questions: m.questions?.map(q => ({
          ...q,
          options: q.options.map(o => o.text)
        }))
      }));

      const payload = {
        title: values.title,
        slug: values.slug,
        description: values.description,
        icon: values.icon,
        order: values.order,
        color: values.color,
        bgColor: values.bgColor,
        borderColor: values.borderColor,
        content: {
          introduction: values.introduction,
          modules: dbModules,
        },
      };

      const ref = doc(collection(firestore, "education"), values.slug);
      await setDoc(ref, payload, { merge: true });
      if (onSaved) onSaved();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar a trilha." });
    }
    finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator - Improved */}
      <ProgressIndicator
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={(stepId) => setCurrentStep(stepId as WizardStep)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: AI Generation */}
              <StepContainer isVisible={currentStep === "ai"}>
                <AIGenerationStep isGenerating={isGenerating} aiTopic={aiTopic} setAiTopic={setAiTopic} onGenerate={handleGenerateWithAI} />
              </StepContainer>

              {/* Step 2: Basic Info */}
              <StepContainer isVisible={currentStep === "basic"}>
                <BasicInfoStep form={form} onGenerateSlug={handleGenerateSlug} />
              </StepContainer>

              {/* Step 3: Appearance */}
              <StepContainer isVisible={currentStep === "appearance"}>
                <AppearanceStep form={form} />
              </StepContainer>

              {/* Step 4: Introduction */}
              <StepContainer isVisible={currentStep === "introduction"}>
                <IntroductionStep form={form} />
              </StepContainer>

              {/* Step 5: Modules */}
              <StepContainer isVisible={currentStep === "modules"}>
                <ModulesStep moduleFields={moduleFields} appendModule={appendModule} removeModule={removeModule} />
              </StepContainer>

              {/* Step 6: Review */}
              <StepContainer isVisible={currentStep === "review"}>
                <ReviewStep form={form} />
              </StepContainer>

              {/* Navigation */}
              <Card className="border-dashed">
                <CardContent className="pt-6 flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newIndex = Math.max(0, currentStepIndex - 1);
                      setCurrentStep(steps[newIndex].id);
                    }}
                    disabled={currentStepIndex === 0}
                  >
                    ← Anterior
                  </Button>

                  {currentStep === "review" ? (
                    <>
                      {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                          Cancelar
                        </Button>
                      )}
                      <Button type="submit" disabled={isSaving} className="min-w-32">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Salvar Trilha
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        const newIndex = Math.min(steps.length - 1, currentStepIndex + 1);
                        setCurrentStep(steps[newIndex].id);
                      }}
                      disabled={currentStepIndex === steps.length - 1}
                    >
                      Próximo →
                    </Button>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Sidebar: Statistics */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <TrackStatistics
              title={form.watch("title").length > 0}
              description={form.watch("description").length > 0}
              introduction={form.watch("introduction").length > 0}
              modulesCount={moduleFields.length}
              totalModules={6}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function AIGenerationStep({
  isGenerating,
  aiTopic,
  setAiTopic,
  onGenerate,
}: {
  isGenerating: boolean;
  aiTopic: string;
  setAiTopic: (topic: string) => void;
  onGenerate: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Criar Trilha com IA
        </CardTitle>
        <CardDescription>
          Digite um tema e deixe a inteligência artificial gerar uma proposta completa de curso.
          Você poderá editar qualquer coisa nos próximos passos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <FormLabel>Tema da Trilha</FormLabel>
          <Input
            placeholder='Ex: "Como sair das dívidas" ou "Investindo para iniciantes"'
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onGenerate();
            }}
          />
          <p className="text-xs text-muted-foreground">
            Descreva o tema ou conceito que você deseja que a IA crie uma trilha educacional.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !aiTopic.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar com IA
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function BasicInfoStep({
  form,
  onGenerateSlug,
}: {
  form: ReturnType<typeof useForm<TrackFormValues>>;
  onGenerateSlug: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Informações Básicas
        </CardTitle>
        <CardDescription>
          Defina o título, descrição e identificador da trilha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Trilha</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Diagnóstico Financeiro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (identificador para URL)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="diagnostico-financeiro" {...field} />
                </FormControl>
                <Button type="button" variant="outline" onClick={onGenerateSlug} className="shrink-0">
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hifens.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (para o card)</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Um resumo breve e atraente sobre esta trilha." {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Máximo 2-3 frases que resumem o conteúdo.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordem de Exibição</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

function AppearanceStep({ form }: { form: ReturnType<typeof useForm<TrackFormValues>> }) {
  const color = form.watch("color");
  const bgColor = form.watch("bgColor");
  const borderColor = form.watch("borderColor");
  const icon = form.watch("icon");
  const title = form.watch("title");
  const description = form.watch("description");
  const modules = form.watch("modules");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Aparência e Design
        </CardTitle>
        <CardDescription>
          Escolha as cores e ícone. A prévia atualiza em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tema Rápido */}
        <div className="space-y-3">
          <FormLabel className="text-sm font-semibold">Escolha um Tema</FormLabel>
          <ColorPicker
            value={{ color, bgColor, borderColor }}
            onChange={(theme: ColorTheme) => {
              form.setValue("color", theme.color, { shouldValidate: true });
              form.setValue("bgColor", theme.bgColor, { shouldValidate: true });
              form.setValue("borderColor", theme.borderColor, { shouldValidate: true });
            }}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <FormLabel>Ícone da Trilha</FormLabel>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {LUCIDE_COMMON_ICONS.map((iconName) => {
              const IconComp = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => form.setValue("icon", iconName, { shouldValidate: true })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all hover:scale-110",
                    icon === iconName
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-muted-foreground/20 hover:border-primary/50"
                  )}
                  title={iconName}
                >
                  <IconComp className="h-6 w-6 mx-auto" />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Clique para escolher. Mais ícones disponíveis em lucide-react.
          </p>
        </div>

        <Separator />

        {/* Live Preview */}
        <div className="space-y-3">
          <FormLabel>Prévia da Trilha</FormLabel>
          <TrackPreview
            title={title}
            description={description}
            icon={icon}
            color={color}
            bgColor={bgColor}
            borderColor={borderColor}
            modulesCount={modules.length}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function IntroductionStep({ form }: { form: ReturnType<typeof useForm<TrackFormValues>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Introdução da Trilha
        </CardTitle>
        <CardDescription>
          Escreva um parágrafo motivador que aparecerá no topo da página.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="introduction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto de Introdução</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Descreva o que o usuário aprenderá nesta trilha. Você pode usar **negrito**, *itálico* e outros formatos Markdown."
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-2">
                Suporta formatação Markdown: **negrito**, *itálico*, [links](url), etc.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

function ModulesStep({
  moduleFields,
  appendModule,
  removeModule,
}: {
  moduleFields: any[];
  appendModule: (value: any) => void;
  removeModule: (index: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Módulos da Trilha
        </CardTitle>
        <CardDescription>
          Crie e organize os módulos educacionais. Mínimo 1 módulo obrigatório.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {moduleFields.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Nenhum módulo adicionado ainda.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => appendModule({ type: "narrative", title: "", subtitle: "", points: [], experiences: [], habits: [], questions: [] })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeiro Módulo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {moduleFields.map((field, index) => (
              <ModuleField key={field.id} moduleIndex={index} removeModule={removeModule} />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendModule({ type: "narrative", title: "", subtitle: "", points: [], experiences: [], habits: [], questions: [] })}
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Módulo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewStep({ form }: { form: ReturnType<typeof useForm<TrackFormValues>> }) {
  const values = form.watch();
  const errors = form.formState.errors;
  const isValid = form.formState.isValid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Revisar e Finalizar
        </CardTitle>
        <CardDescription>
          Verifique se tudo está correto antes de salvar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isValid && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              ⚠️ Existem erros no formulário. Volte aos passos anteriores para corrigi-los.
            </p>
          </div>
        )}

        <div className="grid gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">RESUMO DA TRILHA</h4>
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">TÍTULO</span>
                <p className="text-base font-bold">{values.title || "–"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">SLUG</span>
                <p className="text-sm font-mono">{values.slug || "–"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">DESCRIÇÃO</span>
                <p className="text-sm line-clamp-2">{values.description || "–"}</p>
              </div>
              <div className="pt-2">
                <span className="text-xs font-semibold text-muted-foreground">MÓDULOS ({values.modules.length})</span>
                <div className="mt-2 space-y-1">
                  {values.modules.map((mod, idx) => (
                    <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                      {idx + 1}. {mod.title || "Sem título"}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">PRÉVIA DA TRILHA</h4>
            <TrackPreview
              title={values.title}
              description={values.description}
              icon={values.icon}
              color={values.color}
              bgColor={values.bgColor}
              borderColor={values.borderColor}
              modulesCount={values.modules.length}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MODULE FIELD (SIMPLIFIED)
// ============================================================================

function ModuleField({ moduleIndex, removeModule }: { moduleIndex: number; removeModule: (index: number) => void; }) {
  const { control, watch } = useFormContext<TrackFormValues>();
  const moduleType = watch(`modules.${moduleIndex}.type`);
  const title = watch(`modules.${moduleIndex}.title`);

  const { fields: pointFields, append: appendPoint, remove: removePoint } = useFieldArray({ control, name: `modules.${moduleIndex}.points` });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: `modules.${moduleIndex}.experiences` });
  const { fields: habitFields, append: appendHabit, remove: removeHabit } = useFieldArray({ control, name: `modules.${moduleIndex}.habits` });
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({ control, name: `modules.${moduleIndex}.questions` });

  return (
    <Card className="border bg-muted/20">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Módulo {moduleIndex + 1}: {title || "Sem título"}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={() => removeModule(moduleIndex)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name={`modules.${moduleIndex}.type`}
            render={({ field: typeField }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={typeField.onChange} value={typeField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="narrative">Narrativa (Texto)</SelectItem>
                    <SelectItem value="psychology">Psicologia (Pontos)</SelectItem>
                    <SelectItem value="practicalExperiences">Experiências Práticas</SelectItem>
                    <SelectItem value="microHabits">Micro-Hábitos</SelectItem>
                    <SelectItem value="tool">Ferramenta Interativa</SelectItem>
                    <SelectItem value="finalQuiz">Quiz Final</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`modules.${moduleIndex}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {moduleType === "narrative" && (
          <FormField
            control={control}
            name={`modules.${moduleIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição/Narrativa (Markdown)</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {moduleType === "psychology" && (
          <div className="space-y-2 rounded-md border p-4">
            <h4 className="text-sm font-medium">Pontos de Psicologia</h4>
            {pointFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-md border bg-background/50 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">Ponto {index + 1}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removePoint(index)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <FormField
                  control={control}
                  name={`modules.${moduleIndex}.points.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Título do ponto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`modules.${moduleIndex}.points.${index}.details`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Detalhes (Markdown)" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendPoint({ title: '', details: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Ponto
            </Button>
          </div>
        )}

        {moduleType === "microHabits" && (
          <div className="space-y-2 rounded-md border p-4">
            <h4 className="text-sm font-medium">Micro-Hábitos</h4>
            {habitFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`modules.${moduleIndex}.habits.${index}.text`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder={`Hábito ${index + 1}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeHabit(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendHabit({ text: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Hábito
            </Button>
          </div>
        )}

        {moduleType === "finalQuiz" && (
          <div className="space-y-2 rounded-md border p-4">
            <h4 className="text-sm font-medium">Quiz Final</h4>
            {questionFields.map((field, index) => (
              <QuizQuestionField key={field.id} moduleIndex={moduleIndex} questionIndex={index} removeQuestion={removeQuestion} />
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendQuestion({ question: '', options: [{ text: '' }, { text: '' }], correctAnswer: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Pergunta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuizQuestionField({ moduleIndex, questionIndex, removeQuestion }: { moduleIndex: number, questionIndex: number, removeQuestion: (index: number) => void }) {
  const { control, watch } = useFormContext<TrackFormValues>();
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control, name: `modules.${moduleIndex}.questions.${questionIndex}.options` });

  return (
    <div className="space-y-2 rounded-md border bg-background/50 p-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold">Pergunta {questionIndex + 1}</span>
        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeQuestion(questionIndex)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <FormField
        control={control}
        name={`modules.${moduleIndex}.questions.${questionIndex}.question`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder="Qual é a pergunta?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pl-4 space-y-2">
        <FormLabel className="text-xs">Opções de Resposta</FormLabel>
        <Controller
          control={control}
          name={`modules.${moduleIndex}.questions.${questionIndex}.correctAnswer`}
          render={({ field: radioField }) => (
            <RadioGroup onValueChange={radioField.onChange} value={radioField.value}>
              {optionFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <RadioGroupItem value={watch(`modules.${moduleIndex}.questions.${questionIndex}.options.${index}.text`)} id={`q${questionIndex}o${index}`} />
                  <Controller
                    control={control}
                    name={`modules.${moduleIndex}.questions.${questionIndex}.options.${index}.text`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={`Opção ${index + 1}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeOption(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        <Button type="button" size="sm" variant="ghost" onClick={() => appendOption({ text: '' })}>
          <PlusCircle className="mr-2 h-3 w-3" />
          Adicionar Opção
        </Button>
      </div>
    </div>
  );
}
