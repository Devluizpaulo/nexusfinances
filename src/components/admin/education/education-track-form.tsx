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
import { cn } from "@/lib/utils";
import { Loader2, PlusCircle, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateEducationTrack, type GenerateTrackOutput } from "@/ai/flows/generate-education-track-flow";

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
  options: z.array(z.string().min(1, "Opção não pode estar vazia.")).min(2, "Mínimo de 2 opções."),
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
  habits: z.array(z.string().min(1, "Hábito não pode estar vazio.")).optional(),
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

interface EducationTrackFormProps {
  initialValues?: Partial<TrackFormValues>;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function EducationTrackForm({ initialValues, onSaved, onCancel }: EducationTrackFormProps) {
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [jsonInput, setJsonInput] = useState("");
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
        // Mapeia o resultado da IA para o formato do formulário
        const formValues: TrackFormValues = {
          ...result,
          order: form.getValues('order'), // Mantém a ordem atual
          bgColor: "bg-slate-100 dark:bg-slate-800",
          borderColor: "border-slate-200 dark:border-slate-700",
          color: "text-slate-600 dark:text-slate-300",
        };
        form.reset(formValues);
        toast({ title: "Conteúdo Gerado!", description: "O formulário foi preenchido com o conteúdo da IA. Revise e salve." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro na Geração", description: err.message || "Não foi possível gerar o conteúdo." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportJson = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      const values: TrackFormValues = {
        title: parsed.title ?? "",
        slug: parsed.slug ?? "",
        description: parsed.description ?? "",
        icon: parsed.icon ?? "Compass",
        bgColor: parsed.bgColor ?? "bg-slate-100",
        borderColor: parsed.borderColor ?? "border-slate-200",
        color: parsed.color ?? "text-slate-600",
        order: parsed.order ?? 0,
        introduction: parsed.content?.introduction ?? "",
        modules: parsed.content?.modules ?? [],
      };
      form.reset(values);
      toast({ title: "JSON Importado", description: "O formulário foi preenchido com os dados do JSON." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro no JSON", description: "O JSON fornecido é inválido." });
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

  const onSubmit = async (values: TrackFormValues) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
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
          modules: values.modules,
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
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardHeader>
            <CardTitle>Editor de Trilha Educacional</CardTitle>
            <CardDescription>
              Crie ou edite uma jornada de aprendizado para os usuários.
            </CardDescription>
          </CardHeader>
          
           <CardContent className="space-y-4">
                <div className="space-y-2 rounded-md border border-dashed bg-muted/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                        <div className="space-y-1 flex-1">
                            <h4 className="text-base font-semibold flex items-center gap-2 text-primary">
                              <Sparkles className="h-4 w-4" />
                              Geração de Conteúdo com IA
                            </h4>
                            <p className="text-xs text-muted-foreground">Insira um tema e deixe a IA criar uma proposta de curso completa para você.</p>
                            <Input
                                placeholder='Ex: "Como sair das dívidas" ou "Investindo para iniciantes"'
                                value={aiTopic}
                                onChange={e => setAiTopic(e.target.value)}
                            />
                        </div>
                        <Button type="button" size="sm" onClick={handleGenerateWithAI} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar com IA
                        </Button>
                    </div>
                </div>

                 <div className="space-y-2 rounded-md border border-dashed bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-muted-foreground">Importar via JSON (Opcional)</h4>
                            <p className="text-xs text-muted-foreground">Cole um JSON com a estrutura de uma trilha para preencher o formulário.</p>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={handleImportJson} className="shrink-0">
                            Carregar
                        </Button>
                    </div>
                    <Textarea
                        rows={2}
                        placeholder='{ "slug": "minha-trilha", "title": "...", "content": { ... } }'
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                    />
                </div>
            </CardContent>

            <Separator />
          
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da trilha</FormLabel>
                    <FormControl><Input placeholder="Ex: Diagnóstico Financeiro" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (identificador)</FormLabel>
                     <div className="flex gap-2">
                       <FormControl><Input placeholder="diagnostico-financeiro" {...field} /></FormControl>
                       <Button type="button" variant="outline" onClick={handleGenerateSlug}>Gerar</Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardContent>
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição curta (para o card)</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Um resumo breve sobre o que é esta trilha." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

             <CardContent>
               <FormField
                control={form.control}
                name="introduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Introdução da Trilha (Markdown)</FormLabel>
                    <FormControl><Textarea rows={4} placeholder="Texto completo de introdução que aparece no topo da página da trilha." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField control={form.control} name="icon" render={({ field }) => (
                    <FormItem><FormLabel>Ícone (Lucide)</FormLabel><FormControl><Input placeholder="Compass" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="order" render={({ field }) => (
                    <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="color" render={({ field }) => (
                    <FormItem><FormLabel>Classe de cor (texto/ícone)</FormLabel><FormControl><Input placeholder="text-blue-600" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="bgColor" render={({ field }) => (
                    <FormItem><FormLabel>Classe de Fundo</FormLabel><FormControl><Input placeholder="bg-blue-50" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="borderColor" render={({ field }) => (
                    <FormItem><FormLabel>Classe de Borda</FormLabel><FormControl><Input placeholder="border-blue-200" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </CardContent>
            
            <Separator />
            
            <CardHeader>
                <CardTitle>Módulos</CardTitle>
                <CardDescription>Adicione e configure os módulos que compõem esta trilha.</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {moduleFields.map((field, index) => (
                <ModuleField key={field.id} moduleIndex={index} removeModule={removeModule} />
              ))}
              
              <Button type="button" variant="outline" onClick={() => appendModule({ type: "narrative", title: "", subtitle: "", points: [], experiences: [], habits: [], questions: [] })}>
                Adicionar Módulo
              </Button>
            </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Trilha
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function ModuleField({ moduleIndex, removeModule }: { moduleIndex: number; removeModule: (index: number) => void; }) {
  const { control, watch } = useFormContext<TrackFormValues>();
  const moduleType = watch(`modules.${moduleIndex}.type`);

  const { fields: pointFields, append: appendPoint, remove: removePoint } = useFieldArray({ control, name: `modules.${moduleIndex}.points` });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: `modules.${moduleIndex}.experiences` });
  const { fields: habitFields, append: appendHabit, remove: removeHabit } = useFieldArray({ control, name: `modules.${moduleIndex}.habits` });
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({ control, name: `modules.${moduleIndex}.questions` });

  return (
     <Card className="border-dashed bg-muted/20">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Módulo {moduleIndex + 1}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={() => removeModule(moduleIndex)}>Remover</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Common module fields */}
        <div className="grid gap-4 md:grid-cols-2">
            <FormField control={control} name={`modules.${moduleIndex}.type`} render={({ field: typeField }) => (
                <FormItem><FormLabel>Tipo</FormLabel>
                    <Select onValueChange={typeField.onChange} value={typeField.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="narrative">Narrativa (Texto)</SelectItem>
                            <SelectItem value="psychology">Psicologia (Pontos clicáveis)</SelectItem>
                            <SelectItem value="practicalExperiences">Experiências Práticas</SelectItem>
                            <SelectItem value="microHabits">Micro-Hábitos (Checklist)</SelectItem>
                            <SelectItem value="tool">Ferramenta Interativa</SelectItem>
                            <SelectItem value="finalQuiz">Quiz Final</SelectItem>
                        </SelectContent>
                    </Select>
                <FormMessage /></FormItem>
            )}/>
            <FormField control={control} name={`modules.${moduleIndex}.title`} render={({ field }) => (
                <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        <FormField control={control} name={`modules.${moduleIndex}.subtitle`} render={({ field }) => (
            <FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        
        {moduleType === 'narrative' && (
          <FormField control={control} name={`modules.${moduleIndex}.description`} render={({ field }) => (
              <FormItem><FormLabel>Descrição/Narrativa (Markdown)</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        )}

        {moduleType === 'psychology' && (
          <div className="space-y-3 rounded-md border p-4">
            <h4 className="text-sm font-medium">Pontos de Psicologia</h4>
            {pointFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-md border bg-background/50 p-3">
                <div className="flex justify-between items-center"><span className="text-xs font-semibold">Ponto {index + 1}</span><Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removePoint(index)}><Trash2 className="h-3 w-3"/></Button></div>
                <FormField control={control} name={`modules.${moduleIndex}.points.${index}.title`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Título do ponto" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={control} name={`modules.${moduleIndex}.points.${index}.details`} render={({ field }) => (<FormItem><FormControl><Textarea placeholder="Detalhes do ponto (Markdown)" rows={3} {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendPoint({ title: '', details: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Ponto</Button>
          </div>
        )}
        
         {moduleType === 'practicalExperiences' && (
          <div className="space-y-3 rounded-md border p-4">
            <h4 className="text-sm font-medium">Experiências Práticas</h4>
            {experienceFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-md border bg-background/50 p-3">
                 <div className="flex justify-between items-center"><span className="text-xs font-semibold">Experiência {index + 1}</span><Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeExperience(index)}><Trash2 className="h-3 w-3"/></Button></div>
                <FormField control={control} name={`modules.${moduleIndex}.experiences.${index}.title`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Título da experiência" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={control} name={`modules.${moduleIndex}.experiences.${index}.description`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Descrição curta" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={control} name={`modules.${moduleIndex}.experiences.${index}.details`} render={({ field }) => (<FormItem><FormControl><Textarea placeholder="Detalhes da experiência (Markdown)" rows={3} {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendExperience({ title: '', description: '', details: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Experiência</Button>
          </div>
        )}

        {moduleType === 'microHabits' && (
          <div className="space-y-3 rounded-md border p-4">
            <h4 className="text-sm font-medium">Micro-Hábitos</h4>
            {habitFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField control={control} name={`modules.${moduleIndex}.habits.${index}`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder={`Hábito ${index + 1}`} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeHabit(index)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendHabit('')}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Hábito</Button>
          </div>
        )}

        {moduleType === 'tool' && (
            <FormField control={control} name={`modules.${moduleIndex}.componentName`} render={({ field }) => (
                <FormItem><FormLabel>Nome do Componente da Ferramenta</FormLabel><FormControl><Input placeholder="Ex: InterestCalculator" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        )}

        {moduleType === 'finalQuiz' && (
          <div className="space-y-3 rounded-md border p-4">
            <h4 className="text-sm font-medium">Quiz Final</h4>
            {questionFields.map((field, index) => (
               <QuizQuestionField key={field.id} moduleIndex={moduleIndex} questionIndex={index} removeQuestion={removeQuestion} />
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => appendQuestion({ question: '', options: ['', ''], correctAnswer: '' })}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Pergunta</Button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

function QuizQuestionField({ moduleIndex, questionIndex, removeQuestion }: { moduleIndex: number, questionIndex: number, removeQuestion: (index: number) => void }) {
  const { control, watch, formState } = useFormContext<TrackFormValues>();
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control, name: `modules.${moduleIndex}.questions.${questionIndex}.options` });

  return (
     <div className="space-y-2 rounded-md border bg-background/50 p-3">
      <div className="flex justify-between items-center"><span className="text-xs font-semibold">Pergunta {questionIndex + 1}</span><Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeQuestion(questionIndex)}><Trash2 className="h-3 w-3"/></Button></div>
      <FormField control={control} name={`modules.${moduleIndex}.questions.${questionIndex}.question`} render={({ field }) => (<FormItem><FormControl><Input placeholder="Qual é a pergunta?" {...field} /></FormControl><FormMessage /></FormItem>)}/>
      
      <div className="pl-4 space-y-2">
        <FormLabel className="text-xs">Opções de Resposta</FormLabel>
        <Controller
          control={control}
          name={`modules.${moduleIndex}.questions.${questionIndex}.correctAnswer`}
          render={({ field: radioField }) => (
            <RadioGroup onValueChange={radioField.onChange} value={radioField.value}>
              {optionFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <RadioGroupItem value={watch(`modules.${moduleIndex}.questions.${questionIndex}.options.${index}`)} id={`q${questionIndex}o${index}`} />
                  <FormField control={control} name={`modules.${moduleIndex}.questions.${questionIndex}.options.${index}`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder={`Opção ${index + 1}`} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeOption(index)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              ))}
            </RadioGroup>
          )}
        />

        <Button type="button" size="xs" variant="ghost" onClick={() => appendOption('')}><PlusCircle className="mr-2 h-3 w-3"/>Adicionar Opção</Button>
         <FormMessage>{(formState.errors.modules?.[moduleIndex]?.questions?.[questionIndex]?.correctAnswer as any)?.message}</FormMessage>
      </div>
    </div>
  )
}
