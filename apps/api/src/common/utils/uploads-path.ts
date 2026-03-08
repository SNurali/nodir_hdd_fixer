import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { resolve, isAbsolute, join } from 'path';

// Serverless detection: Vercel, AWS Lambda, etc.
const isServerlessEnvironment = () => {
    try {
        const cwd = process.cwd();
        if (cwd.includes('/var/task') || cwd.includes('/vercel')) return true;
    } catch (e) {}
    return process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.CF_PAGES;
};
const isServerless = isServerlessEnvironment();

// Resolve paths from the repository root so uploads do not depend on process.cwd().
const API_ROOT_DIR = resolve(__dirname, '..', '..', '..');
const WORKSPACE_ROOT_DIR = resolve(API_ROOT_DIR, '..', '..');
const DEFAULT_UPLOADS_DIR = join(WORKSPACE_ROOT_DIR, 'uploads');
const LEGACY_UPLOADS_DIR = join(API_ROOT_DIR, 'uploads');

export function getUploadsDir(): string {
    const configuredPath = process.env.UPLOADS_DIR?.trim();

    if (!configuredPath) {
        return DEFAULT_UPLOADS_DIR;
    }

    return isAbsolute(configuredPath)
        ? configuredPath
        : resolve(WORKSPACE_ROOT_DIR, configuredPath);
}

export function getAvatarUploadsDir(): string {
    return join(getUploadsDir(), 'avatars');
}

export function toUploadsFilePath(uploadUrl: string | null | undefined): string | null {
    if (!uploadUrl || !uploadUrl.startsWith('/uploads/')) {
        return null;
    }

    const relativePath = uploadUrl.replace(/^\/uploads\/?/, '');
    return join(getUploadsDir(), relativePath);
}

export function migrateLegacyUploads(): void {
    // Skip migration in serverless environments (read-only filesystem)
    if (isServerless) {
        return;
    }

    const uploadsDir = getUploadsDir();

    if (!existsSync(LEGACY_UPLOADS_DIR) || LEGACY_UPLOADS_DIR === uploadsDir) {
        return;
    }

    try {
        copyDirectoryContents(LEGACY_UPLOADS_DIR, uploadsDir);
    } catch (error) {
        // Silently ignore errors in serverless (read-only filesystem)
        console.warn('Failed to migrate legacy uploads:', error);
    }
}

function copyDirectoryContents(sourceDir: string, targetDir: string): void {
    try {
        mkdirSync(targetDir, { recursive: true });
    } catch (error) {
        console.warn(`Failed to create target directory ${targetDir}:`, error);
        return;
    }

    for (const entry of readdirSync(sourceDir)) {
        const sourcePath = join(sourceDir, entry);
        const targetPath = join(targetDir, entry);
        const stat = statSync(sourcePath);

        if (stat.isDirectory()) {
            copyDirectoryContents(sourcePath, targetPath);
            continue;
        }

        if (!existsSync(targetPath)) {
            copyFileSync(sourcePath, targetPath);
        }
    }
}
