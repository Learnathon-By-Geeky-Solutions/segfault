import { cookies } from "next/headers";
const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

const PRODUCTION = process.env.PRODUCTION === "true" || false;

export async function POST(req: Request) {
	try {
		const drfResponse = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/signin`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Cookie': req.headers.get('Cookie') ?? ""
			},
			body: JSON.stringify(await req.json())
		});

		const drfResponseJson = await drfResponse.json();
		if (drfResponse.ok) {
			// extract token from response
			const { access, refresh } = drfResponseJson.data;
			const cookieStore = await cookies();
			cookieStore.set("access", access, {
				path: "/",
				sameSite: PRODUCTION ? "none" : "lax",
				secure: PRODUCTION ? true : false,
				...(PRODUCTION ? { domain: ".codesirius.tech" } : {}),
			});

			cookieStore.set("refresh", refresh, {
				path: "/",
				sameSite: PRODUCTION ? "none" : "lax",
				secure: PRODUCTION ? true : false,
				...(PRODUCTION ? { domain: ".codesirius.tech" } : {}),
			});

			// use httpOnly: true, secure: true in production

			// remove token from response and add redirect url
			delete drfResponseJson.data;
			drfResponseJson["data"] = { redirect: "/" };

			return new Response(JSON.stringify(drfResponseJson), {
				status: drfResponse.status,
				statusText: drfResponse.statusText,
				headers: {
					'Content-Type': 'application/json',
				}
			});
		}
		// pass through error response
		return new Response(JSON.stringify(drfResponseJson), {
			status: drfResponse.status,
			statusText: drfResponse.statusText,
			headers: {
				'Content-Type': 'application/json',
			}
		});
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ message: "An error occurred" }), {
			status: 500,
			statusText: "Internal Server Error",
			headers: {
				'Content-Type': 'application/json',
			}
		});
	}
}

