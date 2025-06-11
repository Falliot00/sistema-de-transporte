// frontend/app/page.tsx

import { PageLayout } from "@/components/layout/page-layout";
import { AlarmTabs } from "@/components/alarms/alarm-tabs";

export default function Home() {
  return (
    <PageLayout
      title="Gestión de Alarmas"
      description="Revise, confirme o rechace las alarmas generadas por los dispositivos."
    >
      {/* El componente AlarmTabs ahora maneja toda la lógica y la UI */}
      <AlarmTabs />
    </PageLayout>
  );
}