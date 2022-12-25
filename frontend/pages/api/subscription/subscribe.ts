import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { encodeBase64, hash } from 'bcryptjs';
import { compare } from 'bcryptjs'
import { getRegistrationHtml } from "@/lib/mailer/registration";
import { optionsWithFrom, sendMail } from "@/lib/mailer/mailer";

const prisma = usePrisma()
const handler = getDefaultHandler()

handler.get(response(async (req, res) => {
	var j = '{ "amount": { "value": "2.00", "currency": "RUB" }, "confirmation": { "type": "embedded","locale": "en_US"},"capture": false, "description": "Заказ №73"}'
	console.log(j)
	fetch("https://api.yookassa.ru/v3/payments", {
		body: j,
		headers: {
			"Authorization": 'Basic ' + Buffer.from('884508' + ':' + 'test_3etiMD4uJEYSuBxCRqTZ7wLD8hPV-qx0kSFAB1_Dtnw').toString('base64'),
			"Content-Type": "application/json",
			"Idempotence-Key": "rtyhghn",
		},
		method: 'POST',

	}).then(async p => {
		console.log("sucess")

		try {
			const json = await p.json()
			console.log(json)
			/* const checkout = (window as any).YooMoneyCheckoutWidget({
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
			}).catch(() => console.log("error render")) */
		} catch {
			console.log("undefined json")
			console.log(p)
		}

	}).catch(p => {
		console.log("error")
		console.log(p)
	})
	return {}
}))

export default handler
