import React from 'react';
import {headers} from "next/headers";
import {User, ProblemsResponse} from "@/lib/features/api/types";
import Grid from "@mui/material/Grid2";
import ProblemsList from "@/app/problems/problems-list";

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

    // Fetch problems data directly from Django backend
    const response = await fetch(`${DJANGO_BACKEND_URL}/api/v1/problems/`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch problems');
    }
    
    const problemsData: ProblemsResponse = await response.json();

    return (
        <Grid container>
            <Grid size={12}>
                <ProblemsList initialData={problemsData} />
            </Grid>
        </Grid>
    );
};

export default Page;
