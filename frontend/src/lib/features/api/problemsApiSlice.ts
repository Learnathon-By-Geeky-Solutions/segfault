import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {BACKEND_URL} from "@/lib/constants";
import {CreateUpdateRequest, CreateUpdateResponse} from "@/lib/features/api/types";


export const problemsApiSlice = createApi({
    reducerPath: 'problemsApi',
    baseQuery: fetchBaseQuery({baseUrl: `${BACKEND_URL}/api/problems`}),
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
                method: 'PUT',
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
    useCreateProblemMutation,
    useUpdateProblemMutation
} = problemsApiSlice;
