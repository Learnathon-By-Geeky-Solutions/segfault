import {cookies} from "next/headers";
import {DJANGO_BACKEND_URL} from "@/lib/constants";

export async function POST(req: Request) {
    // const body = await req.json();
    // console.log(body);
    try {
        const drfResponse = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cookie': req.headers.get('Cookie') || '',
            },
            body: JSON.stringify(await req.json())
        });

        const drfResponseJson = await drfResponse.json();
        if (drfResponse.ok) {
            // extract token from response
            const {access, refresh} = drfResponseJson.data;
            const cookieStore = await cookies();
            cookieStore.set("access", access, {path: "/", sameSite: "strict", httpOnly: true, secure: true});
            cookieStore.set("refresh", refresh, {path: "/", sameSite: "strict", httpOnly: true, secure: true});

            // remove token from response and add redirect url
            delete drfResponseJson.data;
            drfResponseJson["data"] = {redirect: "/"};

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
        return new Response(JSON.stringify({message: "An error occurred"}), {
            status: 500,
            statusText: "Internal Server Error",
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
}

