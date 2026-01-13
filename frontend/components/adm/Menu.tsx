import { useSession } from '@/lib/session/hooks'
import { Session } from '@/lib/session'

import styles from '@/styles/adm/Menu.module.scss'

export interface Item {
	label?: string
	callback?: () => void
	items?: Item[]
}

export interface Categories {
	label?: string
	items?: Item[]
}

export interface Props {
	categories?: Categories[]
}

const Avatar = ({ session }: { session: Session }) => {
	return <section className={styles.avatar}>
		{session.user?.image
			? <img src={session.user?.image} className={styles.img} />
			: <div className={styles.img}>
				<span>
					{session.user?.name ? session.user.name[0] : 'U'}
				</span>
			</div>
		}
	</section>
}


const Menu = ({ categories }: Props) => {
	const session = useSession()

	const getItem = (item: Item, key: string) => <li key={key}>
		<a onClick={item.callback}>{item.label}</a>
		{(item.items && item.items?.length > 0)
				&& <ul>{item.items.map((p, index) => getItem(p, `${key}-${index}`))}</ul>}
	</li>

	if (!session || session === 'loading') return null
	return (
		<menu className={`${styles.menu} ${styles.hide}`}>
			<Avatar session={session} />
			<section className={styles.content}>
				{categories?.map((c, index) => (
					<div key={c.label ?? index}>
						<header>{c.label}</header>
						<ul>{c.items?.map((p, itemIndex) => getItem(p, `${c.label ?? index}-${itemIndex}`))}</ul>
					</div>
				))}
			</section>
			<section className={styles.hidden} />
		</menu>
	)
}

export default Menu
