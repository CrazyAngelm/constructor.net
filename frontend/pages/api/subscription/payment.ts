import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { encodeBase64, hash } from 'bcryptjs';
import { compare } from 'bcryptjs'
import { getRegistrationHtml } from "@/lib/mailer/registration";
import { optionsWithFrom, sendMail } from "@/lib/mailer/mailer";
import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';
import { v4 } from 'uuid'
import { SubscribeReq, SubscribeRes } from "@/lib/dto/subscription";

const prisma = usePrisma()
const handler = getDefaultHandler()


handler.post(response(async (req, res) => {
	console.log(req.body)

	return { response: {} }
}))

export default handler
