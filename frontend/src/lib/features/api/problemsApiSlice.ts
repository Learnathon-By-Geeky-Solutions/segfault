import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {
    CreateUpdateReferenceSolutionRequest, CreateUpdateReferenceSolutionResponse,
    CreateUpdateRequest,
    CreateUpdateResponse, DeleteHiddenTestsRequest, DeleteHiddenTestsResponse,
    DeleteSampleTestRequest,
    DeleteSampleTestResponse,
    ProcessHiddenTestsRequest,
    ProcessHiddenTestsResponse,
    UpsertExecutionConstraintRequest,
    UpsertExecutionConstraintResponse,
    UpsertSampleTestsRequest,
    UpsertSampleTestsResponse,
    ProblemsResponse,
    Tag
} from "@/lib/features/api/types";
const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


export const problemsApiSlice = createApi({
    reducerPath: 'problemsApi',
    baseQuery: fetchBaseQuery({baseUrl: `${NEXT_PUBLIC_BACKEND_URL}/api/problems`}),
    endpoints: (builder) => ({
        getProblems: builder.query<ProblemsResponse, { page?: number; title?: string; tags?: number[] }>({
            query: (params) => ({
                url: '/',
                method: 'GET',
                params: {
                    page: params.page || 1,
                    ...(params.title && { title: params.title }),
                    ...(params.tags && params.tags.length > 0 && { tags: params.tags.join(',') })
                }
            })
        }),
        getTags: builder.query<{ data: Tag[] }, void>({
            query: () => ({
                url: '/tags/',
                method: 'GET'
            })
        }),
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
        createReferenceSolution: builder.mutation<CreateUpdateReferenceSolutionResponse, CreateUpdateReferenceSolutionRequest>({
            query: ({problemId, ...data}) => ({
                url: `/${problemId}/reference-solutions/`,
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
        updateReferenceSolution: builder.mutation<CreateUpdateReferenceSolutionResponse, CreateUpdateReferenceSolutionRequest>({
            query: ({id, problemId, ...data}) => ({
                url: `/${problemId}/reference-solutions/${id}`,
                method: 'PATCH',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
        publishProblem: builder.mutation<{ status: number; message: string; timestamp: string }, { problemId: number }>({
            query: ({ problemId }) => ({
                url: `/${problemId}/publish/`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),
    })
});


export const {
    useGetProblemsQuery,
    useGetTagsQuery,
    useCreateProblemMutation,
    useUpdateProblemMutation,
    useUpsertExecutionConstraintsMutation,
    useUpsertSampleTestsMutation,
    useDeleteSampleTestMutation,
    useProcessHiddenTestsMutation,
    useDeleteHiddenTestsMutation,
    useCreateReferenceSolutionMutation,
    useUpdateReferenceSolutionMutation,
    usePublishProblemMutation
} = problemsApiSlice;

