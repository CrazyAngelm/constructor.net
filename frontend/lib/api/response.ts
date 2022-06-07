import { NextApiRequest, NextApiResponse } from "next"

export const response = <T>(getResponse: () => Promise<T>)
	: (req: NextApiRequest, res: NextApiResponse) => Promise<void> => {
	return async (req, res) => {
		try {
			const resp = await getResponse()
			res.status(200).json(resp)
		} catch (err) {
			res.status(502).end(JSON.stringify({
				code: 502,
				url: req.url,
				msg: err
			}))
		}
	}
}
