import {cookies} from "next/headers";
import {NEXTJS_BACKEND_URL} from "@/lib/constants";


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

