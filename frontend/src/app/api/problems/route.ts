import {cookies} from "next/headers";
import { NextRequest, NextResponse } from 'next/server';
import {headers} from "next/headers";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = searchParams.get('page') || '1';
        const title = searchParams.get('title') || '';
        const tags = searchParams.get('tags') || '';

        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        if (title) {
            queryParams.append('title', title);
        }
        if (tags) {
            queryParams.append('tags', tags);
        }

        const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/?${queryParams.toString()}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': headers().get('Authorization') || ''
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch problems');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching problems:', error);
        return NextResponse.json(
            {error: 'Failed to fetch problems'},
            {status: 500}
        );
    }
}
