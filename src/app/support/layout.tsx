import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
