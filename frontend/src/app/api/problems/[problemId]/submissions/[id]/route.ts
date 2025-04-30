import {cookies} from "next/headers";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

export async function GET(req: Request, {params}: {
    params: Promise<{ problemId: number, id: number }>
}) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access')?.value;
    const {problemId, id} = await params;

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/submissions/${id}/`, {
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