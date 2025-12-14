
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default function ChallengesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
