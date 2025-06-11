import { PageLayout } from "@/components/layout/page-layout";
import { AlarmsPage } from "@/components/alarms/alarm-page"; // Cambiamos el nombre para más claridad

export default function Home() {
  return (
    // PageLayout ya no necesita pasar 'title' y 'description' si queremos que el contenido lo maneje
    <PageLayout>
      <AlarmsPage />
    </PageLayout>
  );
}