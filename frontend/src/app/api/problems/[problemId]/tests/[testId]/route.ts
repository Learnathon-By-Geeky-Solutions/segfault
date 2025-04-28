import {cookies} from "next/headers";
const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

export async function DELETE(req: Request, {params}: {
    params: Promise<{ problemId: number, testId: number }>
}) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access')?.value;
    const body = await req.text();
    const {problemId, testId} = await params;
    console.log(problemId, testId);

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/tests/${testId}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
    });

    // pass through the response from Django

    console.log(`response.status: ${response.status}`);

    if (response.status === 204) {
        return new Response(null, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': response.headers.get('Set-Cookie') ?? "",
            }
        });
    }
    return new Response(await response.text(), {
        status: response.status,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': response.headers.get('Set-Cookie') ?? "",
        }
    });
}


