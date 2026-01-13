import { LicenseDto, SubscribeRes } from '@/lib/dto/subscription'
import { makeFetcher } from '@/lib/fetchers'
import { freeSubscribe, subscribe } from '@/lib/requests/subscription'
import { useSession } from '@/lib/session/hooks'
import { YooCheckoutWidget } from '@/lib/YooCheckoutWidget'
import styles from '@/styles/pricing/CardTarif.module.scss'
import Head from 'next/head'
import Image from 'next/image'
import Script from 'next/script'
import { useState } from 'react'
import Auth from '../auth/Auth'
import ok from '@/assets/ok.svg'
import Router from 'next/router'
import Order from './Order'
import Modal from '../controls/Modal'
import { ApiError } from '@/lib/requests'

interface Props {
	license: LicenseDto,
	img?: string
}

const CardTarif = ({ license, img }: Props) => {
	const [ errorAuth, setErrorAuth ] = useState<boolean>(false)
	const [ error, setError ] = useState<string>()
	const [ visible, setVisible ] = useState(false)
	const session = useSession()

	const onSubmit = async () => {
		setVisible(false)
		if (session == null || session == 'loading') return

		try {
			if (license.price == 0) {
				const res = await makeFetcher(freeSubscribe)({
					userId: session.user?.id,
					licenseId: license.id,
				})

				Router.push('/subscribe-sucessful')
			} else{
				const res = await makeFetcher(subscribe)({
					userId: session.user?.id,
					licenseId: license.id,
				}) as SubscribeRes

				YooCheckoutWidget(res.confirmationToken,
					res.returnUrl + '/subscribe-sucessful',
					err => console.log(err))
			}
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status == 412) setError('Вы уже имеете активную подписку, чтобы оформить новую отмените текущую в личном кабинете')
				else setError(err.message)
			}
			console.log('error', err)
		}
	}

	const click = () => {
		setVisible(true)
	}

	return (
		<article className={styles.cardTarifs}>
			<Modal closeCallback={() => setError(undefined)}
				visible={error != undefined}>
				<section className={styles.error}>
					<header>Ошибка!</header>
					<div>{error}</div>
				</section>
			</Modal>
			{visible && <Order okCallback={onSubmit}
				closeCallback={() => setVisible(false)}
				license={license} />}
			<Head>
				<script src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js"></script>
			</Head>
			<div id="payment-form"></div>
			<header>
				{img && <img src={img}></img>}
			</header>
			<section>
				<h3>{license.name}</h3>
				<p className={styles.description}>
					{license.description?.split('-')
						.map(p => p != '' && <div className={styles.block}>
							<div>
								<Image src={ok} objectFit="contain" layout="fill" />
							</div>
							<span>
								{p}
							</span>
						</div>)}
				</p>
				<p className={styles.price}>{license?.price}₽ / {license.duration} д.</p>
				{!session || session == 'loading'
					? <Auth button={<button className={styles.btn}>
						Купить
					</button>} />
					: <button className={styles.btn} onClick={click}>Купить</button>
				}

			</section>
		</article>
	)
}

export default CardTarif
