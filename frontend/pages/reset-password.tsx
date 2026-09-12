import { GetServerSideProps } from 'next'
import { FormEvent, useState } from 'react'
import StatusPage from '@/components/StatusPage'
import { resetPassword } from '@/lib/requests/auth'
import { ApiError } from '@/lib/requests'
import { previewExternalFlowsRestricted } from '@/lib/preview'
import styles from '@/styles/pages.module.scss'

export default function ResetPassword({ token, preview }: { token: string; preview: boolean }) {
 const [ password, setPassword ] = useState('')
 const [ confirmation, setConfirmation ] = useState('')
 const [ error, setError ] = useState('')
 const [ busy, setBusy ] = useState(false)
 const [ done, setDone ] = useState(false)
 async function submit(event: FormEvent) {
  event.preventDefault()
  if (password !== confirmation) { setError('Пароли не совпадают. Проверьте оба поля.'); return }
  setBusy(true); setError('')
  try { await resetPassword({ token, newPassword: password }); setDone(true) } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Не удалось изменить пароль. Попробуйте ещё раз.') } finally { setBusy(false) }
 }
 return <StatusPage title="Новый пароль">
  {preview ? <p>В демонстрационной версии восстановление пароля отключено. Для входа используйте выданную для просмотра учётную запись.</p>
   : done ? <p role="status">Пароль изменён. Войдите с новым паролем.</p>
   : !token ? <p>В ссылке отсутствует код восстановления. Откройте полную ссылку из письма.</p>
   : <><p>Укажите новый пароль для своей учётной записи.</p><form className={styles.form} onSubmit={submit}>
    <label>Новый пароль<input type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
    <label>Повторите пароль<input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button className={styles.primary} disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить пароль'}</button>
   </form></>}
 </StatusPage>
}
export const getServerSideProps: GetServerSideProps = async ({ query }) => ({ props: { token: typeof query.token === 'string' ? query.token : '', preview: previewExternalFlowsRestricted() } })
