"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EducationTrackWizard } from "@/components/admin/education/education-track-wizard";
import { useToast } from "@/hooks/use-toast";

export default function NewEducationTrackPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaved = () => {
    toast({
      title: "🎉 Trilha Salva com Sucesso!",
      description: "Sua nova trilha de educação foi criada e está pronta para os usuários.",
    });
    router.push("/admin/education");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar Nova Trilha Educacional"
        description="Construa uma jornada de aprendizado gamificada passo a passo."
      />
      <EducationTrackWizard
        onSaved={handleSaved}
        onCancel={() => router.push("/admin/education")}
      />
    </div>
  );
}
