import { makeFetcher } from "@/lib/fetchers"
import { useFetchData } from "@/lib/hooks/useFetchData"
import { createManual, getManualById, getManuals, removeManual, updateManual } from "@/lib/requests/manuals"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import styles from '@/styles/adm/Content.module.scss'
import 'react-quill/dist/quill.snow.css'
import { WarningDelete } from "../EditorTemplate"
import Image from "next/image"
import arrow from '@/assets/back.svg'
import menu from '@/assets/menu.png'
import trash from '@/assets/trash.png'
import addFile from '@/assets/addFile.png'
/* import ManualEditor from "./ManualEditor" */




interface PropsItem {
	id: number
	parentId?: number
	name?: string,
	updater?: Updater
	setManualId?: (id: number) => void,
}

const Item = ({ id, parentId, name: _name, updater, ...setter }: PropsItem) => {
	const [ isDelete, setDelete ] = useState(false)
	const [ open, setOpen ] = useState(false)
	const [ name, setName ] = useState(_name)
	const [ modalDelete, setModalDelete ] = useState(false)

	const { data, update } = useFetchData(id, getManuals)

	useEffect(() => {
		setName(_name)
	}, [ _name ])

	useEffect(() => {
		updater?.registery(id, callbackUpdate)
	}, [ updater ])

	const isOpen = (): boolean => data != null && data.length != 0

	const onClick = () => {
		setter.setManualId && setter.setManualId(id)
	}

	const clickCreate = async () => {
		await create(id, setter.setManualId, update)
		setOpen(true)
	}

	const remove = () => {
		setModalDelete(false)
		removeItem(id, () => {
			if (parentId)
				updater?.update(parentId)
		})
	}

	const callbackUpdate = () => {
		console.log('update')
		if (id >= 0)
			makeFetcher(getManualById)(id).then(p => setName(() => p.name))
		update()
	}

	return isDelete ? null : (
		<div className={styles.item} >
			{modalDelete && <WarningDelete callbackRemove={remove} cancel={() => setModalDelete(false)} />}
			<header>
				<div onClick={() => setOpen(p => !p)}>
					{isOpen() &&
						<div className={`${styles.arrow} ${open && styles.open}`}>
							<Image src={arrow} />
						</div>}
				</div>
				{id != -1
					? <span onClick={onClick}>{name}</span>
					: <span className={styles.uninteractable}>{name}</span>
				}
				<section className={styles.menu}>
					<header>
						<Image layout='fill' objectFit='contain' src={menu} />
					</header>
					<section>
						<div onClick={clickCreate} className={styles.icon}>
							<Image layout='fill' objectFit='contain' src={addFile} />
						</div>
						{id != -1 && <div onClick={() => setModalDelete(true)} className={styles.icon}>
							<Image layout='fill' objectFit='contain' src={trash} />
						</div>}
					</section>
				</section>
			</header>
			{(open && isOpen()) &&
				<section>
					{data?.map(p => (
						<Item parentId={id} setManualId={setter.setManualId} updater={updater}
							id={p.id} name={p.name} />
					))}
				</section>
			}
		</div>
	)
}

interface ListProps {
	setManualId?: (id: number) => void,
	updater?: Updater
}

const create = async (parentId?: number, setter?: (id: number) => void, update?: () => void): Promise<void> => {
	const response = await createManual({ parentId })
	setter && setter(response.id)
	update && update()
}
const removeItem = async (id: number, update?: () => void): Promise<void> => {
	await makeFetcher(removeManual)(id)
	update && update()
}
interface UpdaterCallback {
	id: number,
	callback: () => void
}
class Updater {

	callbacks: UpdaterCallback[]

	constructor() {
		this.callbacks = []
	}

	update(id: number) {
		this.callbacks.find(p => p.id == id)?.callback()
	}

	registery(id: number, callback: () => void) {
		this.callbacks.push({ id, callback })
	}
}

const updater = new Updater()

const ManualEditor = dynamic(() => import('./ManualEditor'), { ssr: false })

const Manual = () => {
	const [ value, setValue ] = useState('')
	const [ manualId, setManualId ] = useState<number>()


	return (
		<article className={styles.content}>
			<section className={styles.list}>
				<Item id={-1} name='Manuals' setManualId={setManualId} updater={updater} />
			</section>
			<section className={styles.editor}>
				{manualId &&
					<ManualEditor id={manualId} callbackUpdate={() => updater.update(manualId)}
						callbackBack={() => setManualId(undefined)} />}
			</section>
		</article>
	)
}

export default Manual
