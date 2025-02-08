import React from 'react';
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {User} from "@/lib/features/api/types";
import AddProblem from "@/app/problems/add/add-problem";

export const metadata = {
    title: "Create a Problem",
}

const Page = async () => {
    const headersList = await headers();

    let user: User | null = null;
    if (headersList.has('x-user')) {
        const _user = headersList.get('x-user');
        if (typeof _user === 'string') {
            user = JSON.parse(_user);
        }
    }

    if (!user) {
        redirect("/auth/signin?next=/problems/add");
    }

    return (
        <div>
            <AddProblem />
            {/*<SplitPane leftChildren={<h1>hi</h1>} rightChildren={<h1>hi</h1>}/>*/}
        </div>
    );
};

export default Page;