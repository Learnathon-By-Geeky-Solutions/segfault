import React from 'react';
import CreateProblemStepper from "@/components/stepper"
import ProblemMetaData from "@/app/problems/create/problem-meta-data";
import {headers} from "next/headers";
import {User} from "@/lib/features/api/types";
import {redirect} from "next/navigation";
import SplitPane from "@/components/SplitPane";
import LivePreview from "@/components/live-preview";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

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
            <CreateProblemStepper step={0}/>
            <SplitPane
                leftChildren={
                    <ProblemMetaData
                        availableLanguages={languages.data}
                        availableTags={tags.data}/>
                }
                rightChildren={<LivePreview/>}/>
        </div>
    );
};

export default Page;