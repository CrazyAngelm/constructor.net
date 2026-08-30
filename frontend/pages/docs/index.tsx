import Layout from '@/components/Layout'
import { NextPage } from 'next'
import styles from '@/styles/docs/index.module.scss'
import { useFetchData } from '@/lib/hooks/useFetchData'
import { getManuals } from '@/lib/requests/manuals'
import { useState } from 'react'
import { Manual } from '@/lib/dto/manuals'
import arrow from '@/assets/arrow.svg'
import Image from 'next/image'
import dynamic from 'next/dynamic'

interface PropsItem {
	manual: Manual
	selectCallback: (manual: Manual) => void
}

const Item = ({ manual, selectCallback }: PropsItem) => {
	const [ open, setOpen ] = useState(false)

	const { data } = useFetchData(manual.id, getManuals)

	const isOpen = (): boolean => data !== null && data !== undefined && data.length !== 0

	return (
		<section className={styles.item}>
			<header>
				<div onClick={() => setOpen(p => !p)}>
					{isOpen()
						&& <div className={`${styles.arrow} ${open && styles.open}`}>
							<Image src={arrow} alt="" />
						</div>}
				</div>
				<span onClick={() => selectCallback(manual)}>
					{manual.name}
				</span>
			</header>
			<section>
				{open
					&& data?.map(p => <Item key={p.id}
						manual={p} selectCallback={selectCallback} />)}
			</section>
		</section>
	)
}

const Docs: NextPage = () => {
	const [ manual, setManual ] = useState<Manual>()
	const { data } = useFetchData(-1, getManuals)

	const QuillEditorReadonly = dynamic(() => import('../../components/controls/QuillEditorReadonly'), { ssr: false })

	const openManual = (manual: Manual) => {
		setManual(manual)
	}

	return (
		<Layout footer={false}>
			<article className={styles.docs}>
				<section className={styles.list}>
					<header>Документация</header>
					{data?.map(p => <Item key={p.id} manual={p}
						selectCallback={openManual} />)}
				</section>
				<section className={styles.content}>
					<header>{manual?.name}</header>
					<QuillEditorReadonly value={manual?.html} />
				</section>
			</article>
		</Layout>
	)
}

export default Docs
