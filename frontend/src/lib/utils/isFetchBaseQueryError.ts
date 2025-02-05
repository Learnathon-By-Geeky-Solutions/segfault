import {FetchBaseQueryError} from "@reduxjs/toolkit/query";
import {APIError} from "@/lib/features/api/types";


export function isFetchBaseQueryError(
    error: unknown
): error is FetchBaseQueryError {
    const apiError = (error as FetchBaseQueryError).data as APIError;
    return apiError !== null && apiError !== undefined;
}