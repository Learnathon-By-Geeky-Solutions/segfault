import {cookies} from "next/headers";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

export async function GET(req: Request, {params}: {
    params: Promise<{ problemId: number }>
}) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access')?.value;
    const {problemId} = await params;
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/submissions/?page=${page}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return new Response(await response.text(), {
        status: response.status,
        statusText: response.statusText,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': response.headers.get('Set-Cookie') ?? "",
        }
    });
}

export async function POST(req: Request, {params}: {
    params: Promise<{ problemId: number }>
}) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access')?.value;
    const body = await req.text();
    const {problemId} = await params;

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/submissions/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: body
    });

    return new Response(await response.text(), {
        status: response.status,
        statusText: response.statusText,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': response.headers.get('Set-Cookie') ?? "",
        }
    });
} 