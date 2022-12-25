import styles from '@/styles/pricing/CardTarif.module.scss'
import Image from 'next/image'

interface Props {
	title?: string
	img?: string
	price?: number
	description?: string
}

const CardTarif = ({ title, img, price, description }: Props) => {

	const onSubmit = () => {
		var j = '{ "amount": { "value": "2.00", "currency": "RUB" }, "confirmation": { "type": "embedded","locale": "en_US"},"capture": false, "description": "Заказ №72"}'
		console.log(j)
		fetch("https://api.yookassa.ru/v3/payments", {
			body: j,
			headers: {
				"Authorization": 'Basic ' + Buffer.from('884508' + ':' + 'test_3etiMD4uJEYSuBxCRqTZ7wLD8hPV-qx0kSFAB1_Dtnw').toString('base64'),
				"Content-Type": "application/json",
				"Idempotence-Key": "qwer",
				"Access-Control-Allow-Origin": "https://labstudio-inc",
				"Access-Control-Expose-Headers": "Authorization,Idempotence-Key"
			},
			method: 'POST',
		}).then(async p => {
			console.log("sucess")

			try {
				const json = await p.json()
				console.log(json)
				const checkout = (window as any).YooMoneyCheckoutWidget({
					confirmation_token: json.confirmation.confirmation_token,
					return_url: 'https://labstudio-inc.ru',
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
				}).catch(() => console.log("error render"))
			} catch {
				console.log("undefined json")
				console.log(p)
			}

		}).catch(p => {
			console.log("error")
			console.log(p)
		})
	}

	return (
		<article className={styles.cardTarifs}>
			<header>
				{img && <img src={img}></img>}
			</header>
			<section>
				<h3>{title}</h3>
				<p className={styles.description}>
					{description}
				</p>
				<p className={styles.price}>{price}₽/мес.</p>
				<button onClick={onSubmit}>Купить</button>
			</section>
		</article>
	)
}

export default CardTarif
