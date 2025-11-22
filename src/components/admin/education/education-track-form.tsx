"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const moduleSchema = z.object({
  type: z.enum([
    "psychology",
    "practicalExperiences",
    "microHabits",
    "narrative",
    "finalQuiz",
    "tool",
  ]),
  title: z.string().min(1, "Título obrigatório"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  points: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  experiences: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  habits: z.array(z.string()).optional(),
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(2, "Mínimo de 2 opções"),
        correctAnswer: z.string(),
      })
    )
    .optional(),
  component: z.string().optional(),
});

const trackSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  icon: z.string().min(1, "Ícone obrigatório"),
  bgColor: z.string().default("bg-slate-50"),
  borderColor: z.string().default("border-slate-200"),
  color: z.string().default("text-slate-700"),
  order: z.coerce.number().int().nonnegative().default(0),
  introduction: z.string().min(1, "Introdução obrigatória"),
  modules: z.array(moduleSchema).min(1, "Adicione pelo menos um módulo"),
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
  const [jsonError, setJsonError] = useState<string | null>(null);

  const form = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      description: initialValues?.description ?? "",
      icon: initialValues?.icon ?? "Compass",
      bgColor: initialValues?.bgColor ?? "bg-slate-50",
      borderColor: initialValues?.borderColor ?? "border-slate-200",
      color: initialValues?.color ?? "text-slate-700",
      order: initialValues?.order ?? 0,
      introduction: initialValues?.introduction ?? "",
      modules: initialValues?.modules ?? [],
    },
  });

  const handleImportJson = () => {
    if (!jsonInput.trim()) return;
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);

      // Espera um shape semelhante ao documento salvo em /education
      const values: any = {
        title: parsed.title ?? "",
        slug: parsed.slug ?? "",
        description: parsed.description ?? "",
        icon: parsed.icon ?? "Compass",
        bgColor: parsed.bgColor ?? "bg-slate-50",
        borderColor: parsed.borderColor ?? "border-slate-200",
        color: parsed.color ?? "text-slate-700",
        order: parsed.order ?? 0,
        introduction: parsed.content?.introduction ?? "",
        modules: parsed.content?.modules ?? [],
      };

      form.reset(values, { keepDefaultValues: false });
    } catch (err: any) {
      setJsonError("JSON inválido. Verifique a sintaxe.");
    }
  };

  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  const handleGenerateSlug = () => {
    const title = form.getValues("title");
    if (!title) return;
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    form.setValue("slug", slug, { shouldValidate: true });
  };

  const onSubmit = async (values: TrackFormValues) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const cleanedModules = values.modules.map((module) => {
        const cleaned: any = {
          type: module.type,
          title: module.title,
        };

        if (module.subtitle) cleaned.subtitle = module.subtitle;
        if (module.description) cleaned.description = module.description;
        if (module.points && module.points.length > 0) cleaned.points = module.points;
        if (module.experiences && module.experiences.length > 0) cleaned.experiences = module.experiences;
        if (module.habits && module.habits.length > 0) cleaned.habits = module.habits;
        if (module.questions && module.questions.length > 0) cleaned.questions = module.questions;
        if (module.component) cleaned.component = module.component;

        return cleaned;
      });

      const payload = {
        slug: values.slug,
        title: values.title,
        description: values.description,
        icon: values.icon,
        bgColor: values.bgColor,
        borderColor: values.borderColor,
        color: values.color,
        order: values.order,
        content: {
          introduction: values.introduction,
          modules: cleanedModules,
        },
      };

      const ref = doc(collection(firestore, "education"), values.slug);
      await setDoc(ref, payload, { merge: true });
      if (onSaved) onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardHeader className="space-y-1">
            <CardTitle>Nova Trilha de Educação</CardTitle>
            <CardDescription>
              Monte ou importe uma trilha que será exibida na Jornada Financeira.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Importação de JSON */}
            <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                    Importar trilha via JSON (opcional)
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Cole aqui um JSON no formato usado na coleção <code>/education</code> e clique em
                    "Carregar no formulário" para pré-preencher os campos.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleImportJson}
                  className="shrink-0"
                >
                  Carregar no formulário
                </Button>
              </div>
              <Textarea
                rows={3}
                placeholder={
                  '{ "slug": "diagnostico-vida-financeira", "title": "...", "content": { "introduction": "...", "modules": [...] } }'
                }
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
              {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da trilha</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Diagnóstico: A Verdadeira Foto da Vida Financeira" {...field} />
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
                    <FormLabel>Slug (identificador único)</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="diagnostico-vida-financeira" {...field} />
                        <Button type="button" variant="outline" onClick={handleGenerateSlug}>
                          Gerar
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição curta</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Resumo da trilha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="introduction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Introdução (markdown simples)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Texto de boas-vindas e contexto da jornada" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone (Lucide)</FormLabel>
                    <FormControl>
                      <Input placeholder="Compass" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bgColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe de fundo</FormLabel>
                    <FormControl>
                      <Input placeholder="bg-blue-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="borderColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe de borda</FormLabel>
                    <FormControl>
                      <Input placeholder="border-blue-200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe de cor principal</FormLabel>
                  <FormControl>
                    <Input placeholder="text-blue-600" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <Separator className="mt-2" />

          <CardHeader>
            <CardTitle>Módulos da trilha</CardTitle>
            <CardDescription>
              Estruture a jornada em blocos: psicologia, práticas, micro-hábitos, narrativa, quiz, ferramentas.
              Comece simples: 2–4 módulos por trilha já funcionam muito bem.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {moduleFields.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum módulo adicionado ainda.</p>
            )}

            <div className="space-y-4">
              {moduleFields.map((field, index) => (
                <Card key={field.id} className="border-dashed">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">Módulo {index + 1}</CardTitle>
                      <CardDescription>Configure o conteúdo deste módulo.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeModule(index)}>
                      Remover
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`modules.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de módulo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="psychology">Fundamento psicológico (texto + pontos)</SelectItem>
                                <SelectItem value="practicalExperiences">Práticas reais (tarefas guiadas)</SelectItem>
                                <SelectItem value="microHabits">Micro-hábitos (lista de ações diárias)</SelectItem>
                                <SelectItem value="narrative">Narrativa simbólica (história/imagem mental)</SelectItem>
                                <SelectItem value="finalQuiz">Quiz / reflexão final</SelectItem>
                                <SelectItem value="tool">Ferramenta (calculadora, simulador)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`modules.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título do módulo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex.: Mapa Emocional das Dívidas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`modules.${index}.subtitle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtítulo</FormLabel>
                          <FormControl>
                            <Input placeholder="Linha de apoio para contexto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`modules.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição / narrativa do módulo</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Use este espaço para contar a história, explicar o porquê e guiar o usuário."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Campos específicos por tipo de módulo */}
                    {(() => {
                      const type = form.watch(`modules.${index}.type`);

                      if (type === "psychology") {
                        return (
                          <FormField
                            control={form.control}
                            name={`modules.${index}.points`}
                            render={() => (
                              <FormItem>
                                <FormLabel>Pontos principais (fundamento psicológico)</FormLabel>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Liste ideias-chave que serão apresentadas como tópicos clicáveis.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const current = form.getValues(`modules.${index}.points`) || [];
                                      form.setValue(`modules.${index}.points`, [
                                        ...current,
                                        { title: "", description: "" },
                                      ]);
                                    }}
                                  >
                                    Adicionar ponto
                                  </Button>
                                  {(form.watch(`modules.${index}.points`) || []).map((_: any, pIndex: number) => (
                                    <div key={pIndex} className="grid gap-2 md:grid-cols-2">
                                      <Input
                                        placeholder="Título do ponto"
                                        value={form.watch(`modules.${index}.points.${pIndex}.title`) || ""}
                                        onChange={(e) =>
                                          form.setValue(
                                            `modules.${index}.points.${pIndex}.title`,
                                            e.target.value,
                                          )
                                        }
                                      />
                                      <Input
                                        placeholder="Descrição curta"
                                        value={
                                          form.watch(
                                            `modules.${index}.points.${pIndex}.description`,
                                          ) || ""
                                        }
                                        onChange={(e) =>
                                          form.setValue(
                                            `modules.${index}.points.${pIndex}.description`,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      if (type === "practicalExperiences") {
                        return (
                          <FormField
                            control={form.control}
                            name={`modules.${index}.experiences`}
                            render={() => (
                              <FormItem>
                                <FormLabel>Experiências práticas</FormLabel>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Crie tarefas reais para o usuário executar (ex.: conversar com alguém, fazer simulação).
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const current = form.getValues(`modules.${index}.experiences`) || [];
                                      form.setValue(`modules.${index}.experiences`, [
                                        ...current,
                                        { title: "", description: "" },
                                      ]);
                                    }}
                                  >
                                    Adicionar experiência
                                  </Button>
                                  {(form.watch(`modules.${index}.experiences`) || []).map((_: any, eIndex: number) => (
                                    <div key={eIndex} className="grid gap-2 md:grid-cols-2">
                                      <Input
                                        placeholder="Título da experiência"
                                        value={
                                          form.watch(
                                            `modules.${index}.experiences.${eIndex}.title`,
                                          ) || ""
                                        }
                                        onChange={(e) =>
                                          form.setValue(
                                            `modules.${index}.experiences.${eIndex}.title`,
                                            e.target.value,
                                          )
                                        }
                                      />
                                      <Input
                                        placeholder="Como a pessoa faz essa prática?"
                                        value={
                                          form.watch(
                                            `modules.${index}.experiences.${eIndex}.description`,
                                          ) || ""
                                        }
                                        onChange={(e) =>
                                          form.setValue(
                                            `modules.${index}.experiences.${eIndex}.description`,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      if (type === "microHabits") {
                        return (
                          <FormField
                            control={form.control}
                            name={`modules.${index}.habits`}
                            render={() => (
                              <FormItem>
                                <FormLabel>Micro-hábitos</FormLabel>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Liste pequenas ações diárias (ex.: olhar saldo, registrar 1 gasto, guardar R$ 2).
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const current = form.getValues(`modules.${index}.habits`) || [];
                                      form.setValue(`modules.${index}.habits`, [...current, ""]);
                                    }}
                                  >
                                    Adicionar micro-hábito
                                  </Button>
                                  {(form.watch(`modules.${index}.habits`) || []).map((_: any, hIndex: number) => (
                                    <Input
                                      key={hIndex}
                                      placeholder="Descreva o micro-hábito"
                                      value={
                                        form.watch(
                                          `modules.${index}.habits.${hIndex}`,
                                        ) || ""
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          `modules.${index}.habits.${hIndex}`,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      if (type === "finalQuiz") {
                        return (
                          <FormField
                            control={form.control}
                            name={`modules.${index}.questions`}
                            render={() => (
                              <FormItem>
                                <FormLabel>Perguntas do quiz / reflexão</FormLabel>
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Crie perguntas com opções de resposta; uma delas será marcada como correta.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const current = form.getValues(`modules.${index}.questions`) || [];
                                      form.setValue(`modules.${index}.questions`, [
                                        ...current,
                                        {
                                          question: "",
                                          options: ["", ""],
                                          correctAnswer: "",
                                        },
                                      ]);
                                    }}
                                  >
                                    Adicionar pergunta
                                  </Button>
                                  {(form.watch(`modules.${index}.questions`) || []).map((_: any, qIndex: number) => (
                                    <div key={qIndex} className="space-y-2 rounded-md border p-3">
                                      <Input
                                        placeholder="Pergunta"
                                        value={
                                          form.watch(
                                            `modules.${index}.questions.${qIndex}.question`,
                                          ) || ""
                                        }
                                        onChange={(e) =>
                                          form.setValue(
                                            `modules.${index}.questions.${qIndex}.question`,
                                            e.target.value,
                                          )
                                        }
                                      />
                                      <div className="grid gap-2 md:grid-cols-2">
                                        {(form.watch(
                                          `modules.${index}.questions.${qIndex}.options`,
                                        ) || []).map((_: any, oIndex: number) => (
                                          <Input
                                            key={oIndex}
                                            placeholder={`Opção ${oIndex + 1}`}
                                            value={
                                              form.watch(
                                                `modules.${index}.questions.${qIndex}.options.${oIndex}`,
                                              ) || ""
                                            }
                                            onChange={(e) =>
                                              form.setValue(
                                                `modules.${index}.questions.${qIndex}.options.${oIndex}`,
                                                e.target.value,
                                              )
                                            }
                                          />
                                        ))}
                                      </div>
                                      <Input
                                        placeholder="Resposta correta (copie exatamente uma das opções acima)"
                                        value={
                                          form.watch(
                                            `modules.${index}.questions.${qIndex}.correctAnswer`,
                                          ) || ""
                                        }
                                        onChange={(e) =>
                                          form.setValue(
                                            `modules.${index}.questions.${qIndex}.correctAnswer`,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      if (type === "tool") {
                        return (
                          <FormField
                            control={form.control}
                            name={`modules.${index}.component`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ferramenta (componente)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex.: InterestCalculator, PayoffSimulator"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      return null;
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendModule({
                  type: "psychology",
                  title: "",
                  subtitle: "",
                  description: "",
                  points: [],
                  experiences: [],
                  habits: [],
                  questions: [],
                  component: "",
                })
              }
            >
              Adicionar módulo
            </Button>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t bg-muted/40 py-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar e voltar
              </Button>
            )}
            <Button type="submit" disabled={isSaving} className={cn(isSaving && "opacity-70")}> 
              {isSaving ? "Salvando..." : "Salvar trilha"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
