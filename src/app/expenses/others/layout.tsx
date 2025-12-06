import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function OthersExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
