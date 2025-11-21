import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function DebtsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
