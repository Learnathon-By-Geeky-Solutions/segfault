import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export async function POST(request: Request) {
    try {
        const { code, language } = await request.json();

        // Create a temporary file with proper permissions
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `temp.${getFileExtension(language)}`);
        
        // Write code to temporary file with proper permissions
        await fs.promises.writeFile(tempFile, code, { mode: 0o644 });

        let formattedCode: string;

        switch (language) {
            case 'python':
                formattedCode = await formatPython(tempFile);
                break;
            case 'java':
                formattedCode = await formatJava(tempFile);
                break;
            case 'cpp':
                formattedCode = await formatCpp(tempFile);
                break;
            default:
                return NextResponse.json(
                    { error: 'Unsupported language' },
                    { status: 400 }
                );
        }

        // Clean up temporary file
        try {
            await fs.promises.unlink(tempFile);
        } catch (error) {
            console.warn('Failed to delete temporary file:', error);
        }

        return NextResponse.json({ formattedCode });
    } catch (error) {
        console.error('Formatting error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to format code';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

function getFileExtension(language: string): string {
    switch (language) {
        case 'python':
            return 'py';
        case 'java':
            return 'java';
        case 'cpp':
            return 'cpp';
        default:
            return 'txt';
    }
}

async function formatPython(filePath: string): Promise<string> {
    try {
        // Use absolute path to autopep8
        const { stdout, stderr } = await execAsync(`/usr/local/bin/autopep8 --in-place --aggressive --aggressive ${filePath}`);
        if (stderr) {
            console.error('Python formatting stderr:', stderr);
        }
        return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error('Python formatting error:', error);
        throw new Error(`Failed to format Python code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function formatJava(filePath: string): Promise<string> {
    try {
        // Use absolute path to google-java-format
        const { stdout, stderr } = await execAsync(`/usr/local/bin/google-java-format -i ${filePath}`);
        if (stderr) {
            console.error('Java formatting stderr:', stderr);
        }
        return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error('Java formatting error:', error);
        throw new Error(`Failed to format Java code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function formatCpp(filePath: string): Promise<string> {
    try {
        // Use absolute path to clang-format
        const { stdout, stderr } = await execAsync(`/usr/bin/clang-format -i ${filePath}`);
        if (stderr) {
            console.error('C++ formatting stderr:', stderr);
        }
        return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error('C++ formatting error:', error);
        throw new Error(`Failed to format C++ code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 