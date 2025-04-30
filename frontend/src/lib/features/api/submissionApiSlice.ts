import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {
    CreateSubmissionRequest,
    CreateSubmissionResponse,
    GetSubmissionsRequest,
    GetSubmissionsResponse
} from "@/lib/features/api/types";

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const submissionApiSlice = createApi({
    reducerPath: 'submissionApi',
    baseQuery: fetchBaseQuery({baseUrl: `${NEXT_PUBLIC_BACKEND_URL}/api`}),
    endpoints: (builder) => ({
        getSubmissions: builder.query<GetSubmissionsResponse, GetSubmissionsRequest>({
            query: ({problemId, page = 1}) => ({
                url: `/problems/${problemId}/submissions`,
                method: 'GET',
                params: { page }
            })
        }),
        createSubmission: builder.mutation<CreateSubmissionResponse, CreateSubmissionRequest>({
            query: ({problemId, ...data}) => ({
                url: `/problems/${problemId}/submissions`,
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        })
    })
});

export const {
    useGetSubmissionsQuery,
    useCreateSubmissionMutation
} = submissionApiSlice; 