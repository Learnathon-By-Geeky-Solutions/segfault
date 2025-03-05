import {cookies} from "next/headers";
import {DJANGO_BACKEND_URL} from "@/lib/constants";

export async function PUT(req: Request, {params}: {
    params: Promise<{ problemId: number }>
}) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access')?.value;
    const body = await req.text();
    const {problemId} = await params;

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/execution-constraints/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: body
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


