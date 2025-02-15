import React, {Suspense} from 'react';
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {User} from "@/lib/features/api/types";
import AddProblem from "@/app/problems/add/add-problem";
import {DJANGO_BACKEND_URL} from "@/lib/constants";

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

    const languageRes = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/languages/`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    const languages = await languageRes.json();

    const tagsRes = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/tags/`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    const tags = await tagsRes.json();

    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <AddProblem languages={languages.data} tags={tags.data}/>
            </Suspense>
        </div>
    );
};

export default Page;
