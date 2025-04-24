import React from 'react';
import ProblemCreateStepper from "@/components/stepper";
import ProblemMetaData from "@/app/problems/create/problem-meta-data";
import {headers} from "next/headers";
import {User} from "@/lib/features/api/types";
import {redirect} from "next/navigation";
import {DJANGO_BACKEND_URL} from "@/lib/constants";
import SplitPane from "@/components/SplitPane";
import LivePreview from "@/components/live-preview";
import {Language, Tag} from "@/app/problems/create/types";
import StatementAndConstraints from "@/app/problems/create/statement-and-constraints";
import Dispatcher from "@/app/problems/create/dispatcher";
import ExecutionConstraints from "@/app/problems/create/execution-constraints";
import TestCases from "@/app/problems/create/test-cases";
import ReferenceSolution from "@/app/problems/create/reference-solution";

const getExecutionConstraints = async (problemId: number) => {
    console.log("fetching execution constraints");
    const res = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/constraints/`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    return await res.json();
}

const getPresignedUrl = async (problemId: number, authorization: string) => {
    console.log("fetching presigned url");
    const res = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/hidden-tests/presigned-url/`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authorization
        }
    });

    return await res.json();
}

const Page = async ({params}: { params: Promise<{ problemId: string, step: string }> }) => {
    const {problemId: _problemId, step: _step} = await params;
    const problemId = parseInt(_problemId);
    let step = parseInt(_step);
    if (isNaN(step)) {
        return <div>Invalid Step</div>
    }
    if (step < 1 || step > 5) {
        return <div>Invalid Step</div>
    }
    step -= 1;

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

    const problem = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/`, {
        headers: {
            'Authorization': headersList.get('Authorization') || "",
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });


    const problemData = await problem.json();
    console.log(problemData.data)

    if (problemData.status !== 200) {
        return <div>Problem Not Found</div>
    }

    if (parseInt(problemData.data.createdBy) !== user.id) {
        return <div>Unauthorized</div>
    }


    const renderLeft = async (step: number) => {
        switch (step) {
            case 0:
                return <ProblemMetaData
                    problemId={problemId}
                    availableLanguages={languages.data}
                    availableTags={tags.data}
                    title={problemData.data.title}
                    selectedLanguages={problemData.data.languages.map((l: Language) => l.id)}
                    selectedTags={problemData.data.tags.map((t: Tag) => t.id)}
                />;
            case 1:
                return <StatementAndConstraints problemId={problemId} statement={problemData.data.description}/>
            case 2:
                return <ExecutionConstraints problemId={problemId}
                                             selectedLanguages={problemData.data.languages}
                                             executionConstraints={problemData.data.executionConstraints}
                />
            case 3:
                const presignedUrlResponse = await getPresignedUrl(problemId,
                    headersList.get('Authorization') || "");
                if (!presignedUrlResponse.data) {
                    return <div>Failed to get presigned url</div>
                }
                return <TestCases problemId={problemId}
                                  sampleTests={problemData.data.sampleTests}
                                  presignedUrl={presignedUrlResponse.data}
                                  hiddenTest={problemData.data.hiddenTestBundle}
                />
            case 4:
                return <>Review</>
        }
    }

    const renderRight = async (step: number) => {
        switch (step) {
            case 0:
                return <LivePreview/>
            case 1:
                return <LivePreview/>
            case 2:
                return <LivePreview/>
            case 3:
                return <ReferenceSolution problemId={problemId}
                                          languages={problemData.data.languages}/>
            case 4:
                return <>Review</>
        }
    }

    return (
        <>
            <ProblemCreateStepper problemId={problemId} step={step}/>
            <Dispatcher title={problemData.data.title} description={problemData.data.description}/>
            <SplitPane
                leftChildren={renderLeft(step)}
                rightChildren={renderRight(step)}/>
        </>
    );
};

export default Page;
