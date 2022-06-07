import { NextApiRequest, NextApiResponse } from 'next';
import nc, { NextConnect } from 'next-connect'

export const getDefaultHandler = (): NextConnect<NextApiRequest, NextApiResponse> => {
	return nc({
		onNoMatch(req: NextApiRequest, res: NextApiResponse) {
			res.status(405).json({
				code: 405,
				url: req.url,
				msg: `Method '${req.method}' Not Allowed`
			});
		},
		onError(err, req, res, next) {
			console.error(err.stack);
			res.status(500).end("Something broke!");
		}
	})
}
