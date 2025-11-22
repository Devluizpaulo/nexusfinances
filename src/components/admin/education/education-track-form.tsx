"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  options: z.array(z.string()).min(2, "Mínimo de 2 opções.").refine(
    (opts) => opts.every(opt => opt.trim() !== ''), 
    { message: "Opções não podem estar vazias." }
  ),
  correctAnswer: z.string().min(1, "Resposta correta é obrigatória."),
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
  habits: z.array(z.string()).optional(),
  questions: z.array(questionSchema).optional(),
  component: z.string().optional(),
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
        ...values,
        modules: undefined, // remove modules from top level
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
                <Card key={field.id} className="border-dashed bg-muted/20">
                  <CardHeader className="flex-row items-center justify-between">
                     <CardTitle className="text-base">Módulo {index + 1}</CardTitle>
                     <Button type="button" variant="ghost" size="sm" onClick={() => removeModule(index)}>Remover</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Common module fields */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name={`modules.${index}.type`} render={({ field: typeField }) => (
                            <FormItem><FormLabel>Tipo</FormLabel>
                                <Select onValueChange={typeField.onChange} value={typeField.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="psychology">Psicologia (Pontos clicáveis)</SelectItem>
                                        <SelectItem value="practicalExperiences">Experiências Práticas</SelectItem>
                                        <SelectItem value="microHabits">Micro-Hábitos (Checklist)</SelectItem>
                                        <SelectItem value="narrative">Narrativa</SelectItem>
                                        <SelectItem value="finalQuiz">Quiz Final</SelectItem>
                                        <SelectItem value="tool">Ferramenta</SelectItem>
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`modules.${index}.title`} render={({ field }) => (
                            <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                     <FormField control={form.control} name={`modules.${index}.subtitle`} render={({ field }) => (
                        <FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name={`modules.${index}.description`} render={({ field }) => (
                        <FormItem><FormLabel>Descrição/Narrativa</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    
                    {/* Specific fields based on type */}
                    {form.watch(`modules.${index}.type`) === 'psychology' && (
                        <div>Psicologia specific fields</div>
                    )}
                     {form.watch(`modules.${index}.type`) === 'finalQuiz' && (
                       <div>Quiz specific fields</div>
                    )}
                    
                  </CardContent>
                </Card>
              ))}
              
              <Button type="button" variant="outline" onClick={() => appendModule({ type: "narrative", title: "" })}>
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
