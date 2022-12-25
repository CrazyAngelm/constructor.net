import { LicenseDto, SubscribeRes } from '@/lib/dto/subscription'
import { makeFetcher } from '@/lib/fetchers'
import { subscribe } from '@/lib/requests/subscription'
import { useSession } from '@/lib/session/hooks'
import { YooCheckoutWidget } from '@/lib/YooCheckoutWidget'
import styles from '@/styles/pricing/CardTarif.module.scss'
import Head from 'next/head'
import Image from 'next/image'
import Script from 'next/script'

interface Props {
	license: LicenseDto,
	img?: string
}

const CardTarif = ({ license, img }: Props) => {
	const session = useSession()

	const onSubmit = async () => {

		if (session == null || session == 'loading') return; //ошибку авторизации кинуть

		try {
			const res = await makeFetcher(subscribe)({
				userId: session.user?.id,
				licenseId: license.id
			}) as SubscribeRes

			YooCheckoutWidget(res.confirmationToken, res.returnUrl,
				(err) => console.log(err))
		} catch (err) {
			console.log("error", err)
		}

		//console.log("sucessful", res)
		/* const checkout = new (window as any).YooMoneyCheckoutWidget({
			confirmation_token: "ct-2b3ac3a2-000f-5000-a000-1683f26ec7f9",
			return_url: 'https://localhost',
			customization: {
				modal: true
			},
			error_callback: (error: any) => {
				console.log("error vidjet")
				console.log(error)
			}
		})
		checkout.render().then(() => {
			console.log("sucess render")
		}).catch(() => console.log("error render")) */
	}

	return (
		<article className={styles.cardTarifs}>
			<Head>
				<script src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js"></script>
			</Head>
			<div id='payment-form'></div>
			<header>
				{img && <img src={img}></img>}
			</header>
			<section>
				<h3>{license.name}</h3>
				<p className={styles.description}>
					{license?.description}
				</p>
				<p className={styles.price}>{license?.price}₽ / {license.duration} д.</p>
				<button onClick={onSubmit}>Купить</button>
			</section>
		</article>
	)
}

export default CardTarif
