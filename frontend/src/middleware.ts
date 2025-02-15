import {cookies} from "next/headers";

import {NextRequest, NextResponse} from "next/server";
import {User} from "@/lib/features/api/types";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

interface UserResponse {
    status: number;
    message: string;
    timestamp: string;
    data: User;
}



const getUser = async (accessToken: string): Promise<User | null> => {
    const user = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/whoami`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!user.ok) {
        return null;
    }
    const userData: UserResponse = await user.json();
    return userData.data;
}

export async function middleware(req: NextRequest) {
    const cookieStore = await cookies();

    console.log("middleware");
    const accessToken = cookieStore.get("access")?.value;
    const refreshToken = cookieStore.get("refresh")?.value;


    if (!accessToken || !refreshToken) {
        return NextResponse.next();
    }


    let user = await getUser(accessToken);
    if (!user) {
        const newAccessToken = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/token/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({refresh: refreshToken})
        });
        if (newAccessToken.ok) {
            const {data: {access}} = await newAccessToken.json();
            // set new access token
            cookieStore.set("access", access);
            user = await getUser(access);
        }
    }


    // add user to headers
    req.headers.set("x-user", JSON.stringify(user));

    // check if user tries to access /signin or /signup while signed in
    const url = req.nextUrl.clone();
    if (url.pathname === "/auth/signin" || url.pathname === "/auth/signup") {
        return NextResponse.redirect("http://localhost:3000/");
    }

    return NextResponse.next({
        headers: req.headers
    });
}


// Apply middleware only to specific routes
export const config = {
    matches: ["/"],
    excludes: ["/api/*", "/_next/*", "/favicon.ico", "/robots.txt", "/static/*"]
};
