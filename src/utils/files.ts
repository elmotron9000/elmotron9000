import { join } from "path";
import { tmpdir } from 'os';
import { existsSync, mkdirSync } from 'fs';


export function getSceneDir(): string {
    const tempPath = join(tmpdir(), 'elmotron9000', "scenes");

    if (!(existsSync(tempPath))) {
        mkdirSync(tempPath, { recursive: true });
    }

    return tempPath;
}