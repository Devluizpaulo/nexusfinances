import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
