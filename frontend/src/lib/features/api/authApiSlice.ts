import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {
    SigninRequest,
    SigninResponse,
    SignupRequest,
    SignupResponse,
    VerificationRequest,
    VerificationResponse
} from "@/lib/features/api/types";
import {NEXTJS_BACKEND_URL} from "@/lib/constants";


export const authApiSlice = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({baseUrl: `${NEXTJS_BACKEND_URL}/api/auth`}),
    endpoints: (builder) => ({
        signup: builder.mutation<SignupResponse, SignupRequest>({
            query: (data) => ({
                url: '/signup',
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }),
        }),

        checkVerification: builder.mutation<VerificationResponse, VerificationRequest>({
            query: (data) => ({
                url: '/verification/check',
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }),
        }),

        signin: builder.mutation<SigninResponse, SigninRequest>({
            query: (data) => ({
                url: '/signin',
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
        }),

    })
})

export const {
    useSignupMutation,
    useCheckVerificationMutation,
    useSigninMutation
    } = authApiSlice;
