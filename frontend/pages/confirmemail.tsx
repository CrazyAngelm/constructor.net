import { GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import StatusPage from '@/components/StatusPage'
import { confirmEmail } from '@/lib/requests/auth'
import { ApiError } from '@/lib/requests'

export default function ConfirmEmail({ token }: { token: string }) {
 const [ status, setStatus ] = useState(token ? 'Проверяем ссылку…' : 'В ссылке отсутствует код подтверждения.')
 const [ error, setError ] = useState(false)
 useEffect(() => {
  if (!token) return
  let active = true
  confirmEmail(token).then(() => { if (active) setStatus('Адрес электронной почты подтверждён. Теперь можно войти в аккаунт.') })
   .catch((cause) => { if (active) { setError(true); setStatus(cause instanceof ApiError ? cause.message : 'Не удалось проверить ссылку. Попробуйте открыть её ещё раз.') } })
  return () => { active = false }
 }, [ token ])
 return <StatusPage title="Подтверждение почты"><p role={error ? 'alert' : 'status'}>{status}</p>{error && <p>Проверьте, что открыли последнюю ссылку из письма.</p>}</StatusPage>
}
export const getServerSideProps: GetServerSideProps = async ({ query }) => ({ props: { token: typeof query.token === 'string' ? query.token : '' } })
