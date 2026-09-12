import StatusPage from '@/components/StatusPage'
import styles from '@/styles/pages.module.scss'
export default function License() {
 return <StatusPage title="Лицензионное соглашение" href="/" action="На главную">
  <p>Условия использования Lab Studio доступны в исходном PDF-документе. Его можно открыть в браузере или сохранить на устройство.</p>
  <p><a className={styles.secondary} href="/docs/license.pdf" target="_blank" rel="noreferrer">Открыть PDF ↗</a></p>
  <p><a href="/docs/license.pdf" download className={styles.secondary}>Скачать соглашение</a></p>
 </StatusPage>
}
