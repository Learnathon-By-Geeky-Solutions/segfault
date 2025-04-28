import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ProblemView from '@/app/problems/[problemId]/ProblemView';

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || "http://localhost:8000";


const Page = async ({params}: {params: Promise<{ problemId: number }>}) => {
    const headersList = await headers();
    const authorization = headersList.get('Authorization') || '';
    const {problemId} = await params;

    try {
        const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/${problemId}/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': authorization
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                notFound();
            }
            throw new Error('Failed to fetch problem');
        }

        const data = await response.json();

        return <ProblemView problem={data.data} />;
    } catch (error) {
        console.error('Error fetching problem:', error);
        throw error;
    }
};

export default Page;