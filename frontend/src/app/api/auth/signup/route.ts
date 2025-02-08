import {DJANGO_BACKEND_URL} from "@/lib/constants";

export async function POST(req: Request) {
    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': req.headers.get('Cookie') ?? ""
        },
        body: JSON.stringify(await req.json())
    });

    return new Response(await response.text(), {
        status: response.status,
        statusText: response.statusText,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': response.headers.get('Set-Cookie') || '',
        }
    });
}

