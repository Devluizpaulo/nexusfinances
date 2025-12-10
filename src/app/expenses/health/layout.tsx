import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
