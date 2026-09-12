import { NextApiRequest, NextApiResponse } from 'next'
import nc, { NextConnect } from 'next-connect'
import { getAuthenticatedApiUser } from './response'
import { previewExternalFlowsRestricted } from '../preview'

export const getDefaultHandler = (): NextConnect<NextApiRequest, NextApiResponse> => {
	return nc({
		onNoMatch(req: NextApiRequest, res: NextApiResponse) {
			res.status(405).json({
				code: 405,
				url: req.url,
				msg: `Method '${req.method}' Not Allowed`,
			})
		},
		onError(err, req, res, next) {
			res.status(500).end('Something broke!')
		},
	}).use(async (req: NextApiRequest, res: NextApiResponse, next) => {
		// Desktop sync exposes the whole catalog; preview users use /api/studio.
		const resource = req.url?.split('?')[0]?.split('/')[2]
		if (previewExternalFlowsRestricted() && resource && ['task', 'task-category', 'course', 'folder', 'worklist', 'manuals', 'versions', 'users'].includes(resource)) {
			const user = await getAuthenticatedApiUser(req)
			if (!user || !user.scopes.includes('admin')) {
				res.status(user ? 403 : 401).json({ message: 'Недостаточно прав доступа' })
				return
			}
		}
		next()
	})
}
