import React from 'react';
import ProblemCreateStepper from "@/components/stepper";
import ProblemMetaData from "@/app/problems/create/problem-meta-data";
import {headers} from "next/headers";
import {User} from "@/lib/features/api/types";
import {redirect} from "next/navigation";
import SplitPane from "@/components/SplitPane";
import LivePreview from "@/components/live-preview";
import {Language, Tag} from "@/app/problems/create/types";
import StatementAndConstraints from "@/app/problems/create/statement-and-constraints";
import Dispatcher from "@/app/problems/create/dispatcher";
import ExecutionConstraints from "@/app/problems/create/execution-constraints";
import TestCases from "@/app/problems/create/test-cases";
import ReferenceSolution from "@/app/problems/create/reference-solution";
import {Metadata} from "next";
import {Box} from "@mui/material";
import {notFound} from "next/navigation";
import ReviewAndPublish from "@/app/problems/create/review-and-publish";

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

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

// export const metadata: Metadata = {
//     title: 'Codesirius',
//     description: 'Ace your next interview',
// }

export async function generateMetadata({params}: { params: Promise<{ problemId: string, step: string }> }): Promise<Metadata> {
    const {problemId: _problemId, step: _step} = await params;
    const problemId = parseInt(_problemId);
    const headersList = await headers();
    const problem = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/`, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': headersList.get('Authorization') || ""
        }
    });
    if (problem.status !== 200) {
        return {
            title: 'Problem Not Found',
            description: 'Problem Not Found'
        }
    }

    const problemData = (await problem.json()).data;

    let step = parseInt(_step);
    if (isNaN(step)) {
        return {
            title: 'Invalid Step',
            description: 'Invalid Step'
        }
    }
    if (step < 1 || step > 5) {
        return {
            title: 'Invalid Step',
            description: 'Invalid Step'
        }
    }
    step -= 1;

    return {
        title: `${problemData.title} - Step ${step + 1}`,
        description: `Create a problem - Step ${step + 1}`,
    }
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

    const problem = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/`, {
        headers: {
            'Authorization': headersList.get('Authorization') || "",
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });


    const problemData = await problem.json();
    // console.log(problemData)

    if (problemData.status !== 200) {
        notFound();
    }

    if (parseInt(problemData.data.createdBy) !== user.id) {
        return <div>Unauthorized</div>
    }

    const renderLeft = async (step: number) => {
        switch (step) {
            case 0:
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
                return <ProblemMetaData
                    problemId={problemId}
                    availableLanguages={languages.data}
                    availableTags={tags.data}
                    title={problemData.data.title}
                    selectedLanguages={problemData.data.languages.map((l: Language) => l.id)}
                    selectedTags={problemData.data.tags.map((t: Tag) => t.id)}
                    difficulty={problemData.data.difficulty}
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
                const refSolRes = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/reference-solutions/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': headersList.get('Authorization') || ""
                    }
                })
                const refSolData = await refSolRes.json();
                // console.log(refSolData.data)
                return <ReferenceSolution problemId={problemId}
                                          languages={problemData.data.languages}
                                          referenceSolutions={refSolData.data}
                        />
        }
    }

    // Fetch reference solutions for review step
    let referenceSolutionsData = [];
    if (step === 4) {
        const refSolRes = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/reference-solutions/`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': headersList.get('Authorization') || ""
            }
        });
        const refSolData = await refSolRes.json();
        referenceSolutionsData = refSolData.data;
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            p: 2
        }}>
            <ProblemCreateStepper problemId={problemId} step={step}/>
            <Dispatcher title={problemData.data.title} description={problemData.data.description}/>
            <Box sx={{ 
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                mt: 2
            }}>
                {
                    step !== 4 ? (
                        <SplitPane
                            leftChildren={await renderLeft(step)}
                            rightChildren={await renderRight(step)}
                        />
                    ) : (
                        <ReviewAndPublish
                            problemId={problemId}
                            title={problemData.data.title}
                            description={problemData.data.description}
                            languages={problemData.data.languages}
                            tags={problemData.data.tags}
                            executionConstraints={problemData.data.executionConstraints}
                            sampleTests={problemData.data.sampleTests}
                            hiddenTestBundle={problemData.data.hiddenTestBundle}
                            referenceSolutions={referenceSolutionsData}
                        />
                    )
                }
            </Box>
        </Box>
    );
};

export default Page;
