import { DefaultSession } from "next-auth";

export interface Session extends DefaultSession {
	socpes: string []
}
