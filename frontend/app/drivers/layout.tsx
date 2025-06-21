import { PageLayout } from "@/components/layout/page-layout";

// Este componente de layout envuelve a toda la sección /drivers,
// asegurando que tanto la lista como las páginas de detalle
// compartan la misma estructura visual con sidebar y header.
export default function DriversLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageLayout>{children}</PageLayout>;
}