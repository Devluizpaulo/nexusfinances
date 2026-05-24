"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { PageHeader } from "@/components/page-header";
import { EducationTrackWizard } from "@/components/admin/education/education-track-wizard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { EducationTrack } from "@/lib/types";

export default function EditEducationTrackPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const [track, setTrack] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrack() {
      if (!firestore || !slug) return;
      try {
        const ref = doc(firestore, "education", slug);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as EducationTrack;
          // Map array items back to format expected by wizard (e.g. habits as {text: string}[], questions options as {text: string}[])
          const mappedModules = data.content?.modules?.map(m => ({
            ...m,
            habits: m.habits?.map(h => ({ text: h })) ?? [],
            questions: m.questions?.map(q => ({
              ...q,
              options: q.options?.map(o => ({ text: o })) ?? []
            })) ?? []
          })) ?? [];

          setTrack({
            title: data.title || "",
            slug: data.slug || "",
            description: data.description || "",
            icon: data.icon || "Compass",
            bgColor: data.bgColor || "bg-slate-100 dark:bg-slate-800",
            borderColor: data.borderColor || "border-slate-200 dark:border-slate-700",
            color: data.color || "text-slate-600 dark:text-slate-300",
            order: data.order ?? 0,
            introduction: data.content?.introduction || "",
            modules: mappedModules,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Trilha não encontrada",
            description: "A trilha que você está tentando editar não existe.",
          });
          router.push("/admin/education");
        }
      } catch (err) {
        console.error("Error fetching track:", err);
        toast({
          variant: "destructive",
          title: "Erro ao carregar",
          description: "Não foi possível carregar os dados da trilha.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrack();
  }, [firestore, slug, router, toast]);

  const handleSaved = () => {
    toast({
      title: "🎉 Trilha Atualizada!",
      description: "Sua trilha de educação foi salva com sucesso.",
    });
    router.push("/admin/education");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-400">Carregando dados da trilha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar Trilha: ${track?.title}`}
        description="Atualize o conteúdo, aparências e módulos da jornada educacional."
      />
      {track && (
        <EducationTrackWizard
          initialValues={track}
          isEdit={true}
          onSaved={handleSaved}
          onCancel={() => router.push("/admin/education")}
        />
      )}
    </div>
  );
}
