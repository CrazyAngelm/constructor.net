import { DefaultSession } from "next-auth";

export interface Session extends DefaultSession {
	scopes: string []
}
