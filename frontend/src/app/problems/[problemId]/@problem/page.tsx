import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ProblemDescription from './ProblemDescription';

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Page = async ({params}: {params: Promise<{ problemId: number }>}) => {
    // Simulate a delay for demonstration purposes
    // await wait(4000);
    const headersList = await headers();
    const authorization = headersList.get('Authorization') || '';
    const { problemId } = await params;

    try {
        // Fetch problem details
        const problemResponse = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': authorization
            }
        });

        if (!problemResponse.ok) {
            console.log('Problem response:', problemResponse.status);
            if (problemResponse.status === 404) {
                notFound();
            }
            // throw new Error('Failed to fetch problem');
        }

        const problemData = await problemResponse.json();
        const problem = problemData.data;

        return <ProblemDescription problem={problem} />;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export default Page;