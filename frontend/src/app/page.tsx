import Home from "@/app/home/home";
import {headers} from "next/headers";
import SessionCreator from "@/app/home/session-creator";
import {User} from "@/types";

export const metadata = {
    title: 'Codesirius',
    description: 'Ace your next interview',
}

export default async function Page() {
    const headersList = await headers();
    const user: User = JSON.parse(headersList.get('x-user') as string);
    console.log(user);
    return (
        <>
            {user && <SessionCreator/>}
            <Home/>
        </>
    );
}
