import { getDefaultHandler } from "@/lib/api/apiHandler";
import { response } from "@/lib/api/response";
import { usePrisma } from "@/lib/api/database";
import { encodeBase64, hash } from 'bcryptjs';
import { compare } from 'bcryptjs'
import { getRegistrationHtml } from "@/lib/mailer/registration";
import { optionsWithFrom, sendMail } from "@/lib/mailer/mailer";

const prisma = usePrisma()
const handler = getDefaultHandler()

handler.post(response(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) return { error: { code: 422, message: "email or password not found" } }

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if (!user) return { error: { code: 422, message: "Неверный логин или пароль" } }

    const checkPassword = await compare(password, user.password ?? "")

    if (!checkPassword) return { error: { code: 422, message: "Неверный логин или пароль" } }

    return { response: user }
}))

export default handler