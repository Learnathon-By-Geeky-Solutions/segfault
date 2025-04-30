import { cookies } from "next/headers";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";
const PRODUCTION = process.env.PRODUCTION === "true" || false;

export async function POST(req: Request) {
    const body = await req.json();
    if (!body.userId) {
        return new Response(JSON.stringify({
            status: 400,
            message: 'Bad Request',
            timestamp: new Date().toISOString(),
            data: {
                errors: [
                    {
                        field: 'userId',
                        message: 'User ID is required'
                    }
                ]
            }
        }), {
            status: 400,
            statusText: 'Bad Request',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/${body.userId}/verification/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': req.headers.get('Cookie') ?? ""
        },
        body: JSON.stringify(body),
    });

    const responseJson = await response.json();
    
    if (response.status === 200) {
        const { access, refresh } = responseJson.data.tokens;
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

        // Remove tokens from response
        delete responseJson.data.tokens;
    }

    return new Response(JSON.stringify(responseJson), {
        status: response.status,
        statusText: response.statusText,
        headers: {
            'Content-Type': 'application/json',
        }
    });
}

