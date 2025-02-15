import {cookies} from "next/headers";
require('dotenv').config();

const NEXTJS_BACKEND_URL = process.env.NEXTJS_BACKEND_URL || "http://localhost:3000";

export async function GET(req: Request) {
    // signout
    // delete access and refresh tokens
    // redirect to /
    if (!req.headers.get("x-user")) {
        return Response.redirect(NEXTJS_BACKEND_URL, 302);
    }
    const cookieStore = await cookies();
    cookieStore.delete("access");
    cookieStore.delete("refresh");
    return Response.redirect(NEXTJS_BACKEND_URL, 302);
}

