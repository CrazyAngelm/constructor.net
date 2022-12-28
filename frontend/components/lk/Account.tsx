import { ScopeEnum } from '@/lib/dto/users'
import { useSession } from '@/lib/session/hooks'
import styles from '@/styles/lk/Account.module.scss'
import Field from '../controls/Fields'

const Account = () => {
	const session = useSession()


	return (<>
		{session != 'loading' && session &&
			<article className={styles.account}>
				<Field value={session?.user?.id} label='Id' isHorizontal
					isReadonly />
				<Field value={session?.user?.email} label='Email'
					isHorizontal isReadonly />
				{session?.scopes.indexOf(ScopeEnum.admin) > -1 &&
					<a href='../adm'>
						<button>В панель администрирования</button>
					</a>}
			</article>
		}
	</>
	)
}

export default Account
