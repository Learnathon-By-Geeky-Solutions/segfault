import {cookies} from "next/headers";


export async function GET(req: Request) {
    // signout
    // delete access and refresh tokens
    // redirect to /
    if (!req.headers.get("x-user")) {
        return Response.redirect("http://localhost:3000/", 302);
    }
    const cookieStore = await cookies();
    cookieStore.delete("access");
    cookieStore.delete("refresh");
    return Response.redirect("http://localhost:3000/", 302);
}

