import { cookies } from "next/headers";
const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const PRODUCTION = process.env.PRODUCTION === "true" || false;

export async function GET(req: Request) {
	// signout
	// delete access and refresh tokens
	// redirect to /
	if (!req.headers.get("x-user")) {
		return Response.redirect(NEXT_PUBLIC_BACKEND_URL, 302);
	}
	const cookieStore = await cookies();
	console.log("Before delete:", cookieStore.getAll());
	cookieStore.delete({
		name: "access",
		path: "/",
		...(PRODUCTION ? { domain: ".codesirius.tech" } : {})
	});

	cookieStore.delete({
		name: "refresh",
		path: "/",
		...(PRODUCTION ? { domain: ".codesirius.tech" } : {})
	});
	console.log("After delete:", cookieStore.getAll());
	return Response.redirect(NEXT_PUBLIC_BACKEND_URL, 302);
}

