import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function EducationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
