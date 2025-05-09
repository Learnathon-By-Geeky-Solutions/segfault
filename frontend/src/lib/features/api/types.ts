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
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
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
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
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

export interface ProcessHiddenTestsRequest {
    problemId: number;
    clientId: string;
}

export interface ProcessHiddenTestsResponse {
    status: number;
    message: string;
    timestamp: string;
}

export interface DeleteHiddenTestsRequest {
    problemId: number;
}

export interface DeleteHiddenTestsResponse {
    status: number;
    message: string;
    timestamp: string;
}

export interface CreateUpdateReferenceSolutionRequest {
    id?: number;
    problemId: number;
    languageId: number;
    code: string;
    clientId: string;
}

export interface ReferenceSolution {
    id: number;
    problemId: number;
    code: string;
    languageId: number;
    verdict: string;
    memory_usage: number;
    execution_time: number;
}

export interface CreateUpdateReferenceSolutionResponse {
    status: number;
    message: string;
    timestamp: string;
    data: ReferenceSolution;
}

export interface Problem {
    id: number;
    title: string;
    languages: {
        id: number;
        name: string;
        version: string;
    }[];
    tags: {
        id: number;
        name: string;
        description: string;
    }[];
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    executionConstraints: {
        id: number;
        languageId: number;
        timeLimit: number;
        memoryLimit: number;
    }[];
    sampleTests: {
        id: number;
        input: string;
        output: string;
    }[];
    hiddenTestBundle: {
        id: number;
        test_count: number;
    };
    createdBy: number;
    status: string;
}

export interface PaginationInfo {
    count: number;
    next: string | null;
    previous: string | null;
    current_page: number;
    total_pages: number;
}

export interface ProblemsResponse {
    status: number;
    message: string;
    timestamp: string;
    data: {
        results: Problem[];
        pagination: PaginationInfo;
    }
}

export interface Tag {
    id: number;
    name: string;
    description: string;
}

export interface Submission {
    id: number;
    problemId: number;
    code: string;
    languageId: number;
    verdict: 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';
    memoryUsage: number | null;
    executionTime: number | null;
    createdAt: string;
}

export interface GetSubmissionsRequest {
    problemId: number;
    page?: number;
}

export interface GetSubmissionsResponse {
    status: number;
    message: string;
    timestamp: string;
    data: {
        results: Submission[];
        pagination: PaginationInfo;
    }
}

export interface CreateSubmissionRequest {
    problemId: number;
    code: string;
    languageId: number;
    clientId: string;
}

export interface CreateSubmissionResponse {
    status: number;
    message: string;
    timestamp: string;
    data: Submission;
}