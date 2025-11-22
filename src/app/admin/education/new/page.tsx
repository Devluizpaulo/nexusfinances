"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EducationTrackForm } from "@/components/admin/education/education-track-form";
import { useToast } from "@/hooks/use-toast";

export default function NewEducationTrackPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaved = () => {
    toast({
      title: "Trilha Salva!",
      description: "A nova trilha de educação foi criada com sucesso.",
    });
    router.push("/admin/dashboard");
    // Forçar o admin dashboard a selecionar a aba de educação
    // (Pode necessitar de uma abordagem mais robusta com context ou query params)
    setTimeout(() => {
        // Workaround to encourage section switch
    }, 100);
  };

  return (
    <div className="space-y-6">
      <EducationTrackForm
        onSaved={handleSaved}
        onCancel={() => router.push("/admin/dashboard")}
      />
    </div>
  );
}
