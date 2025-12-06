import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function HealthExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
