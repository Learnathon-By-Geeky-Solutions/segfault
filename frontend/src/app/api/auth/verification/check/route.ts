import {DJANGO_BACKEND_URL} from "@/lib/constants";

export async function POST(req: Request) {
    const body = await req.json();
    console.log(body);
    if (!body.userId) {
        return new Response(JSON.stringify({
            status: 400,
            message: 'Bad Request',
            timestamp: new Date().toISOString(),
            data: {
                errors: [
                    {
                        field: 'userId',
                        message: 'User ID is required'
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
    // console.log(body);
    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/auth/${body.userId}/verification/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': req.headers.get('Cookie') || '',
        },
        body: JSON.stringify(body),
    });


    const responseJson = await response.json();
    console.log(responseJson);
    // check if status is 200
    // save tokens into a variable
    // delete tokens from response
    // set tokens in cookies
    // send response
    if (response.status === 200) {
        const accessToken = responseJson.data.tokens.access;
        const refreshToken = responseJson.data.tokens.refresh;
        // delete tokens from response
        delete responseJson.data.tokens;
        // set tokens in cookies
        return new Response(JSON.stringify(responseJson), {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `access=${accessToken}; SameSite=Strict; Path=/; HttpOnly; Secure, refresh=${refreshToken}; SameSite=Strict; Path=/; HttpOnly; Secure`,
            }
        })
    }

    // send response as it is
    return new Response(JSON.stringify(responseJson), {
        status: response.status,
        statusText: response.statusText,
        headers: {
            'Content-Type': 'application/json',
        }
    });
}

