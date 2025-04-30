import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import SubmissionsList from './SubmissionsList';

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

const Page = async ({params}: {params: Promise<{ problemId: number }>}) => {
    const headersList = await headers();
    const authorization = headersList.get('Authorization') || '';
    const { problemId } = await params;

    try {
        const submissionsResponse = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/submissions/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': authorization
            }
        });

        if (!submissionsResponse.ok) {
            if (submissionsResponse.status === 404) {
                notFound();
            }
            throw new Error('Failed to fetch submissions');
        }

        const submissionsData = await submissionsResponse.json();
        const submissions= submissionsData.data;

        return <SubmissionsList submissions={submissions} />;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export default Page;