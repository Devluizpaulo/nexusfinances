import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function HousingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
