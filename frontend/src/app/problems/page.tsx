import React from 'react';
import {headers} from "next/headers";
import {User} from "@/lib/features/api/types";
import AddProblemButton from "@/app/problems/add-problem-button";
import Grid from "@mui/material/Grid2";
import ProblemsList from "@/app/problems/problems-list";
import Divider from "@mui/material/Divider";

const Page = async () => {

    // const cookieStore = await cookies();
    const headersList = await headers();

    let user: User | null = null;
    if (headersList.has('x-user')) {
        const _user = headersList.get('x-user');
        if (typeof _user === 'string') {
            user = JSON.parse(_user);
        }
    }

    return (
        <Grid container>
            <Grid size={12}>
                {user && <AddProblemButton />}
            </Grid>
            <Grid size={12}>
                <ProblemsList />
            </Grid>
        </Grid>
    );
};

export default Page;