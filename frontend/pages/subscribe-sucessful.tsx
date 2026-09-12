import StatusPage from '@/components/StatusPage'
import { previewExternalFlowsRestricted } from '@/lib/preview'
export default function SubscriptionResult({ preview }: { preview: boolean }) {
 return <StatusPage title="Статус подписки" href="/lk#subscription" action="Проверить доступ в кабинете">
  <p>{preview ? 'Это демонстрационная версия: платежи здесь отключены, деньги не списываются.' : 'Текущий статус подписки и доступные материалы отображаются в личном кабинете. Сам переход на эту страницу не подтверждает оплату.'}</p>
 </StatusPage>
}
export const getServerSideProps = () => ({ props: { preview: previewExternalFlowsRestricted() } })
