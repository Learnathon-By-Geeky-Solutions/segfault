import {cookies} from "next/headers";
import {DJANGO_BACKEND_URL} from "@/app/api/constants";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access')?.value;
    const body = await req.text();

    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/`,
        {
            method: 'POST',
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
