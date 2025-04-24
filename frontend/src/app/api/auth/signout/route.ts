import {cookies} from "next/headers";
const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_NEXTJS_BACKEND_URL || "http://localhost:3000";

export async function GET(req: Request) {
    // signout
    // delete access and refresh tokens
    // redirect to /
    if (!req.headers.get("x-user")) {
        return Response.redirect(NEXT_PUBLIC_BACKEND_URL, 302);
    }
    const cookieStore = await cookies();
    cookieStore.delete("access");
    cookieStore.delete("refresh");
    return Response.redirect(NEXT_PUBLIC_BACKEND_URL, 302);
}

