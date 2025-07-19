// frontend/app/devices/layout.tsx
import { PageLayout } from "@/components/layout/page-layout";

export default function DevicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageLayout>{children}</PageLayout>;
}