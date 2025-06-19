import { AlarmTabs } from '@/components/alarms/alarm-tabs'
import { PageLayout } from '@/components/layout/page-layout'
import AlarmsPage from '@/components/alarms/alarm-page'
import DashboardPage from './dashboard/page'

export default function Home() {
  return (
    <PageLayout>
      <AlarmsPage />
    </PageLayout>
  )
}