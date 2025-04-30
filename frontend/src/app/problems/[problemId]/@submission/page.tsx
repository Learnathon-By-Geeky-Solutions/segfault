import React from 'react';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import SubmissionPane from './SubmissionPane';

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

const Page = async ({params}: { params: Promise<{ problemId: number }> }) => {
    const headersList = await headers();
    const authorization = headersList.get('Authorization') || '';
    const xUser = headersList.get('x-user') || '';
    const {problemId} = await params;

    try {
        // Fetch problem details
        const problemResponse = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': authorization
            }
        });

        if (!problemResponse.ok) {
            if (problemResponse.status === 404) {
                notFound();
            }
            throw new Error('Failed to fetch problem');
        }

        const problemData = await problemResponse.json();
        const problem = problemData.data;

        return (
            <SubmissionPane
                problemId={problemId}
                languages={problem.languages}
                isAuthenticated={!!xUser}
                problemStatus={problem.status}
            />
        );
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export default Page;