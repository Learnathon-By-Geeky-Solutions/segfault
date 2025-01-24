import {cookies} from "next/headers";

export async function POST(req: Request) {
    console.log(req.body);
    const {theme} = await req.json();
    const cookieStore = await cookies();
    cookieStore.set('theme', theme);
    return Response.json({theme});
}

// fallback
export async function GET() {
    return Response.json({theme: 'light'});
}
