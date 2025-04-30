import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";
const PRODUCTION = process.env.PRODUCTION === "true" || false;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const code = searchParams.get('code');

    if (!userId || !code) {
        return new Response(JSON.stringify({
            status: 400,
            message: 'Bad Request',
            timestamp: new Date().toISOString(),
            data: {
                errors: [
                    {
                        field: 'params',
                        message: 'User ID and verification code are required'
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

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/${userId}/verification/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': req.headers.get('Cookie') ?? ""
        },
        body: JSON.stringify({
            userId: parseInt(userId),
            code: code
        }),
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

        // Redirect to homepage after successful verification
        redirect('/');
    }

    // If verification fails, redirect to signup page with error
    redirect('/auth/signup?error=verification_failed');
} 