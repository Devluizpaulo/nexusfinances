
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function MonetizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout pode ser usado para ambas as páginas (admin e usuário)
  // O controle de acesso é feito dentro da própria página.
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
