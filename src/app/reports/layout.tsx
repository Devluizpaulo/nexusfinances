import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
