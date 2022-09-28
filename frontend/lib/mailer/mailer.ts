import nodemailer from 'nodemailer'

export const getTransport = () => {
	return nodemailer.createTransport({
		host: 'smtp.mail.ru',
		port: 465,
		secure: true,
		auth: {
			user: process.env.MAILER_USER,
			pass: process.env.MAILER_PASS
		}
	})
}

export const sendMail = (mailOptions: any) => {
	getTransport().sendMail(mailOptions, function (err, info) {
		if (err) {
			console.log(err)
		} else {
			console.log(info);
		}
	});
}
