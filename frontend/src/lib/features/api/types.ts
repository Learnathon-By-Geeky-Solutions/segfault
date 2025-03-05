import exp from "node:constants";

export interface FieldError {
    index?: number;  // for bulk operations
    field: string;
    message: any;
}


export interface APIError {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
    errors: FieldError[] | null;
}

export interface SignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password1: string;
    password2: string;
}

export interface SignupResponse {
    status: number,
    message: string;
    timestamp: string;
    data: {
        userId: number,
        isActive: boolean,
    }
}

export interface VerificationRequest {
    userId: number;
    code: string;
}

export interface VerificationResponse {
    status: number,
    message: string;
    timestamp: string;
    data: {
        userId: number,
        isActive: boolean,
    }
}

export interface SigninRequest {
    username: string;
    password: string;
}

export interface SigninResponse {
    status: number,
    message: string;
    timestamp: string;
    data: {
        redirect: string;
    }
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    isActive: boolean;
}

export interface ExecutionConstraint {
    id?: number; // may be undefined if it's a new constraint
    languageId: number;
    timeLimit: number | string;
    memoryLimit: number | string;
}

export interface SampleTest {
    id?: number;
    input: string;
    output: string;
}

export interface CreateUpdateRequest {
    id?: number;
    title?: string;
    languageIds?: number[];
    tagIds?: number[];
    description?: string;
    executionConstraints?: ExecutionConstraint;
    sampleTests?: SampleTest[];
}

export interface CreateUpdateResponse {
    status: number;
    message: string;
    timestamp: string;
    data: {
        id: number;
        title: string;
        description: string;
        languages: number[];
        tags: number[];
        executionConstraints: ExecutionConstraint[];
        sampleTests: SampleTest[];
    }
}

export interface UpsertExecutionConstraintRequest {
    problemId: number;
    executionConstraints: ExecutionConstraint[];
}

export interface UpsertExecutionConstraintResponse {
    status: number;
    message: string;
    timestamp: string;
    data: ExecutionConstraint[];
}

export interface UpsertSampleTestsRequest {
    problemId: number;
    sampleTests: SampleTest[];
}

export interface UpsertSampleTestsResponse {
    status: number;
    message: string;
    timestamp: string;
    data: SampleTest[];
}

export interface DeleteSampleTestRequest {
    problemId: number;
    testId: number;
}

export interface DeleteSampleTestResponse {
    status: number;
    message: string;
    timestamp: string;
}
