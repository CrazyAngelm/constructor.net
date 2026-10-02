import nodemailer from 'labstudio-nodemailer'
import type { SendMailOptions } from 'nodemailer'

export const getTransport = () => {
	if (!process.env.MAILER_USER || !process.env.MAILER_PASS) {
		throw new Error('MAILER_USER and MAILER_PASS are required to send email')
	}
	const transport = nodemailer.createTransport({
		host: 'smtp.mail.ru',
		port: 2525,
		secure: false,
		auth: {
			user: process.env.MAILER_USER,
			pass: process.env.MAILER_PASS,
		},
	})
	return transport
}

export const sendMail = (mailOptions: SendMailOptions) =>
	getTransport().sendMail(mailOptions)

export const optionsWithFrom = (options: SendMailOptions): SendMailOptions => {
	return {
		from: 'Lab Studio <' + process.env.MAILER_USER +'>',
		...options,
	}
}
