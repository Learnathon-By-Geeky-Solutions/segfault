import Home from "@/app/home/home";
import {headers} from "next/headers";
import SessionCreator from "@/app/home/session-creator";
import {User} from "@/lib/features/api/types";
import {redirect} from "next/navigation";

export const metadata = {
    title: 'Codesirius',
    description: 'Ace your next interview',
}

export default async function Page() {
    redirect("/problems");
    const headersList = await headers();
    const user: User = JSON.parse(headersList.get('x-user') as string);
    return (
        <>
            {/*{user && <SessionCreator/>}*/}
            <Home/>
        </>
    );
}
