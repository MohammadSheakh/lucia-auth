// routes/login/google/callback/+server.ts

import { decodeIdToken } from 'arctic';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { google } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { encodeBase32LowerCase } from '@oslojs/encoding';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('google_oauth_state') ?? null;
	const codeVerifier = event.cookies.get('google_code_verifier') ?? null;
	if (code === null || state === null || storedState === null || codeVerifier === null) {
		return new Response(null, {
			status: 400
		});
	}
	if (state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
	} catch (e) {
		// Invalid code or client credentials
		return new Response(null, {
			status: 400
		});
	}
	const claims = decodeIdToken(tokens.idToken());
	const googleUserId = claims.sub;
	const username = claims.name;

	// TODO: Replace this with your own DB query.
	// const existingUser = await getUserFromGoogleId(googleUserId);
	const existingUser = await db
		.select()
		.from(table.user)
		.where(eq(table.user.googleId, googleUserId));

	if (existingUser !== null) {
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser[0].id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	}

	function generateUserId() {
		// ID with 120 bits of entropy, or about the same as UUID v4.
		const bytes = crypto.getRandomValues(new Uint8Array(15));
		const id = encodeBase32LowerCase(bytes);
		return id;
	}

	const userId = generateUserId();

	// TODO: Replace this with your own DB query.
	// const user = await createUser(googleUserId, username);
	const user = await db
		.insert(table.user)
		.values({ id: userId, googleId: googleUserId, username, passwordHash: '' });

	const sessionToken = auth.generateSessionToken();
	const session = await auth.createSession(sessionToken, userId);
	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
