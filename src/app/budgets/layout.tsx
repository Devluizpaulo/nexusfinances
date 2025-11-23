import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function BudgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
