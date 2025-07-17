import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { Payment } from "@a2seven/yoo-checkout";
import { subscribe } from "@/lib/requests/subscription";
import { SubscribeReq } from "@/lib/dto/subscription";
import { Prisma } from "@prisma/client";

const prisma = usePrisma()
const handler = getDefaultHandler()

const addDays = (date: Date, days: number): Date => {
	return new Date(date.setDate(date.getDate() + days))
}


handler.post(
	response(async (req) => {
		const body = JSON.parse(req.body) as SubscribeReq;
		if (!body.userId) return { error: { code: 400 } };

		const result = await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				if (!body.userId) throw{ code: 404, message: "Пользователь не найден" };

				/* 1. уже есть активная/прошлая проба? */
				const existed = await tx.subscription.findFirst({
					where: {
						userId: body.userId,
					}
				});
				if (existed) throw { code: 409, message: "Подписка уже использована" };

				/* 2. лицензия */
				const license = await tx.license.findUnique({
					where: { id: 1 }
				});
				if (!license) throw { code: 404, message: "Лицензия не найдена" };

				const trialDays = license.duration ?? 14;
				const end = addDays(new Date(), trialDays);

				/* 3. создаём подписку сразу активной */
				const sub = await tx.subscription.create({
					data: {
						userId: body.userId,
						licenseId: 1,
						active: true,
						startDate: new Date(),
						endDate: end,
						paymentToken: null,
						courses: await getCourses(tx, 1),
						canceled: false,
					}
				});

				return { };
			}
		).catch((e) => ({ error: e?.code ? e : { code: 500 } }));

		return "error" in result ? result : { response: result };
	})
);

const getCourses = async (tx: Prisma.TransactionClient, licenseId: number)
	: Promise<string> => {

	const license = await tx.license.findUnique({ where: { id: licenseId } })

	const licenseCourses = license?.courses ? JSON.parse(license.courses) as number[]
		: []

	const courses = await tx.course.findMany({
		where: {
			id: {
				notIn: licenseCourses
			},
			deleted: false
		}
	})

	return JSON.stringify(courses.slice(0, license?.freeCourses).map(p => p.id))
}

export default handler
