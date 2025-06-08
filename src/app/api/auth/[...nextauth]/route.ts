import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

const handler = NextAuth({
	providers: [
		KeycloakProvider({
			clientId: process.env.KEYCLOAK_CLIENT_ID!,
			clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
			issuer: process.env.KEYCLOAK_ISSUER!,
		}),
	],
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async jwt({ token, account }) {
			if (account) {
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.expiresAt = account.expires_at * 1000; // Convert to ms
				token.sub = account.id_token
					? JSON.parse(
							Buffer.from(account.id_token.split('.')[1], 'base64').toString()
					  ).sub
					: null;
			}

			// If token is expired, refresh it
			if (Date.now() >= token.expiresAt) {
				try {
					const response = await fetch(
						`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
							body: new URLSearchParams({
								grant_type: 'refresh_token',
								client_id: process.env.KEYCLOAK_CLIENT_ID!,
								client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
								refresh_token: token.refreshToken as string,
							}),
						}
					);

					const refreshed = await response.json();

					token.accessToken = refreshed.access_token;
					token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
					token.expiresAt = Date.now() + refreshed.expires_in * 1000;
				} catch (err) {
					console.error('Failed to refresh token', err);
					return {}; // Return empty to force logout
				}
			}
			return token;
		},
		async session({ session, token }) {
			session.accessToken = token.accessToken;
			session.user.id = token.sub;
			session.expires = new Date(token.expiresAt).toISOString();
			return session;
		},
	},
});

export { handler as GET, handler as POST };
