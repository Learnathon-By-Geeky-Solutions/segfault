import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {
    CreateUpdateRequest,
    CreateUpdateResponse,
    DeleteSampleTestRequest,
    DeleteSampleTestResponse,
    UpsertExecutionConstraintRequest,
    UpsertExecutionConstraintResponse,
    UpsertSampleTestsRequest,
    UpsertSampleTestsResponse
} from "@/lib/features/api/types";
import {NEXTJS_BACKEND_URL} from "@/lib/constants";
import {fit} from "sharp";


export const problemsApiSlice = createApi({
    reducerPath: 'problemsApi',
    baseQuery: fetchBaseQuery({baseUrl: `${NEXTJS_BACKEND_URL}/api/problems`}),
    endpoints: (builder) => ({
        createProblem: builder.mutation<CreateUpdateResponse, CreateUpdateRequest>({
            query: (data) => ({
                url: '/',
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }),
        }),
        updateProblem: builder.mutation<CreateUpdateResponse, CreateUpdateRequest>({
            query: ({id, ...data}) => ({
                url: `/${id}/`,
                method: 'PATCH',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
        upsertExecutionConstraints: builder.mutation<UpsertExecutionConstraintResponse, UpsertExecutionConstraintRequest>({
            query: ({problemId, ...data}) => ({
                url: `/${problemId}/execution-constraints/`,
                method: 'PUT',
                body: data.executionConstraints,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
        upsertSampleTests: builder.mutation<UpsertSampleTestsResponse, UpsertSampleTestsRequest>({
            query: ({problemId, ...data}) => ({
                url: `/${problemId}/tests/`,
                method: 'PUT',
                body: data.sampleTests,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
        deleteSampleTest: builder.mutation<DeleteSampleTestResponse, DeleteSampleTestRequest>({
            query: ({problemId, testId}) => ({
                url: `/${problemId}/tests/${testId}/`,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
    })
});


export const {
    useCreateProblemMutation,
    useUpdateProblemMutation,
    useUpsertExecutionConstraintsMutation,
    useUpsertSampleTestsMutation,
    useDeleteSampleTestMutation,
} = problemsApiSlice;

