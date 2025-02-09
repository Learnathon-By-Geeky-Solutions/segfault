import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {BACKEND_URL} from "@/lib/constants";
import {
    SigninRequest,
    SigninResponse,
    SignupRequest,
    SignupResponse,
    VerificationRequest,
    VerificationResponse
} from "@/lib/features/api/types";


export const authApiSlice = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({baseUrl: `${BACKEND_URL}/api/auth`}),
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
