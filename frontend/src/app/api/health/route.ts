import {DJANGO_BACKEND_URL} from "@/app/api/constants";

export async function GET(req: Request) {
    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/health/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': req.headers.get('Cookie') ?? ""
        },
    });

    // pass through the response from Django

    return new Response(await response.text(), {
        status: response.status,
        statusText: response.statusText,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': response.headers.get('Set-Cookie') ?? "",
        }
    });
}
