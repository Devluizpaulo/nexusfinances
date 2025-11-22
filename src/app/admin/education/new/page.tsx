"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EducationTrackForm } from "@/components/admin/education/education-track-form";

export default function NewEducationTrackPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Trilha de Educação"
        description="Crie uma jornada transformacional para os usuários."
      />

      <EducationTrackForm onCancel={() => router.push("/admin/dashboard")} />
    </div>
  );
}
