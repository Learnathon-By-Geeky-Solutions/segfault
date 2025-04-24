export interface Language {
    id: number;
    name: string;
    version: string;
}

export interface Tag {
    id: number;
    name: string;
    description: string;
}

export interface HiddenTest {
    id: number;
    test_count: number;
}
