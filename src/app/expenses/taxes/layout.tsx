import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function TaxesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
