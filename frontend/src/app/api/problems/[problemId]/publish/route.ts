import {cookies} from "next/headers";
const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

export async function POST(
    req: Request,
    { params }: { params: { problemId: string } }
) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access')?.value;

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${params.problemId}/publish/`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
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