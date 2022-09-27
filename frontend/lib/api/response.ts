import { NextApiRequest, NextApiResponse } from "next"

export interface Error {
	code: number
	message?: string
}

export interface Response<T> {
	response?: T
	error?: Error
}

export const response = <T>(getResponse: (req: NextApiRequest, res: NextApiResponse)
	=> Promise<Response<T>>)
	: (req: NextApiRequest, res: NextApiResponse) => Promise<void> => {
	return async (req, res) => {
		try {
			const resp = await getResponse(req, res)
			if (resp.error) {
				res.status(resp.error.code).json((resp.error))
				return
			}
			res.status(200).json(resp.response)
		} catch (err) {
			console.log(err)
			res.status(502).end(JSON.stringify({
				code: 502,
				url: req.url,
				msg: err
			}))
		}
	}
}
