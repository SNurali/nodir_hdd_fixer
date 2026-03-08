import { afterEach, describe, expect, it } from 'vitest';
import { resolve } from 'path';
import { getAvatarUploadsDir, getUploadsDir, toUploadsFilePath } from './uploads-path';

const ORIGINAL_UPLOADS_DIR = process.env.UPLOADS_DIR;
const WORKSPACE_ROOT_DIR = resolve(__dirname, '..', '..', '..', '..', '..');

describe('uploads-path', () => {
    afterEach(() => {
        if (ORIGINAL_UPLOADS_DIR === undefined) {
            delete process.env.UPLOADS_DIR;
            return;
        }

        process.env.UPLOADS_DIR = ORIGINAL_UPLOADS_DIR;
    });

    it('uses workspace uploads dir by default', () => {
        delete process.env.UPLOADS_DIR;

        expect(getUploadsDir()).toBe(resolve(WORKSPACE_ROOT_DIR, 'uploads'));
        expect(getAvatarUploadsDir()).toBe(resolve(WORKSPACE_ROOT_DIR, 'uploads', 'avatars'));
    });

    it('resolves relative UPLOADS_DIR from workspace root', () => {
        process.env.UPLOADS_DIR = 'storage/media';

        expect(getUploadsDir()).toBe(resolve(WORKSPACE_ROOT_DIR, 'storage/media'));
        expect(toUploadsFilePath('/uploads/avatars/test.jpg')).toBe(
            resolve(WORKSPACE_ROOT_DIR, 'storage/media', 'avatars', 'test.jpg'),
        );
    });

    it('returns null for non-upload urls', () => {
        expect(toUploadsFilePath('/api/users/me')).toBeNull();
    });
});
