import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from '@root/lib/prisma';
import { verifyPassword } from "@root/lib/crpyt";

export default NextAuth({
	// Configure one or more authentication providers
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: 'jwt',
	},
	secret: process.env.SECRET,
	providers: [
		GithubProvider({
		clientId: process.env.GITHUB_ID,
		clientSecret: process.env.GITHUB_SECRET,
		}),
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "email", type: "email" },
				password: { label: "password", type: "password" },
			},
			async authorize(credentials) {
				const possibleUser = await prisma.user.findUnique({
					where: {
						email: credentials.email
					},
					select: {
						password: true
					}
				});

				if(!possibleUser) 
					throw Error("No user exists with this email!");

				const isValid = await verifyPassword(credentials.password, possibleUser.password);

				if(!isValid) 
					throw Error("Wrong password for account!");

				const user = await prisma.user.findUnique({
					where: {
						email: credentials.email
					}
				});

				return user;
			}
		}),

  	],
  	pages: {
    	signIn: '/login',
  	},
  	callbacks: {
		jwt: ({ token, user }) => {
			if(user) token.id = user.id;
			return token;
		},
		session: ({ session, token }) => {
			if(token) session.id = token.id;
			return session;
		}
  	}
});