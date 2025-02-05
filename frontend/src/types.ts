export type themeType = 'light' | 'dark'

export type codesiriusStateType = {
    currentTheme: themeType,
    setCurrentTheme: (theme: themeType) => void,
    isCodesiriusLoading: boolean,
    setCodesiriusLoading: (isLoading: boolean) => void
}

export interface FieldError {
    field: string;
    message: string;
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
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    isActive: boolean;
}
