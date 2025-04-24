import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {
    CreateUpdateRequest,
    CreateUpdateResponse, DeleteHiddenTestsRequest, DeleteHiddenTestsResponse,
    DeleteSampleTestRequest,
    DeleteSampleTestResponse,
    ProcessHiddenTestsRequest,
    ProcessHiddenTestsResponse,
    UpsertExecutionConstraintRequest,
    UpsertExecutionConstraintResponse,
    UpsertSampleTestsRequest,
    UpsertSampleTestsResponse
} from "@/lib/features/api/types";
const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


export const problemsApiSlice = createApi({
    reducerPath: 'problemsApi',
    baseQuery: fetchBaseQuery({baseUrl: `${NEXT_PUBLIC_BACKEND_URL}/api/problems`}),
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
        processHiddenTests: builder.mutation<ProcessHiddenTestsResponse, ProcessHiddenTestsRequest>({
            query: ({problemId, ...data}) => ({
                url: `/${problemId}/hidden-tests/process/`,
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
        deleteHiddenTests: builder.mutation<DeleteHiddenTestsResponse, DeleteHiddenTestsRequest>({
            query: ({problemId}) => ({
                url: `/${problemId}/hidden-tests/`,
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
    useProcessHiddenTestsMutation,
    useDeleteHiddenTestsMutation
} = problemsApiSlice;

