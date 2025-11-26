import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function MonetizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

    