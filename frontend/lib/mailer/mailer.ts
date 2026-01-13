import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'

export const getTransport = () => {

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

export const sendMail = (mailOptions: SendMailOptions) => {
	getTransport().sendMail(mailOptions, function(err) {
		if (err) return
	})
}

export const optionsWithFrom = (options: SendMailOptions): SendMailOptions => {
	return {
		from: 'Lab Studio <' + process.env.MAILER_USER +'>',
		...options,
	}
}
