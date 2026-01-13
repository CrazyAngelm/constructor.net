import nodemailer from 'nodemailer'

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

export const sendMail = (mailOptions: any) => {
	getTransport().sendMail(mailOptions, function(err, info) {
		if (err) {
		} else {
		}
	})
}

export const optionsWithFrom = (options:any):any => {
	return {
		from: 'Lab Studio <' + process.env.MAILER_USER +'>',
		...options,
	}
}
