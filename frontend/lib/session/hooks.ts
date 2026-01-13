import { SessionContextValue, useSession as useSessionHook, UseSessionOptions } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Session } from '.'

export const useSession = (): Session | null | 'loading' => {
	const [ session, setSession ] = useState<Session | null | 'loading'>('loading')

	const _session = useSessionHook()

	useEffect(() => {
		if (_session.status === 'loading') setSession('loading')
		else setSession(_session.data as Session)
	}, [ _session ])

	return session
}
