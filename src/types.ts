export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Config {
    videoFile: string;
    subtitles: boolean;
    headless?: boolean;
}

export interface BaseSceneMetadata {
    filename: string;
    audio: Audio[];  
}

export type SceneMetadata = VideoSceneMetadata | ImageSceneMetadata;

export interface VideoSceneMetadata extends BaseSceneMetadata {
    type: "video";
}

export interface ImageSceneMetadata extends BaseSceneMetadata {
    duration: number;
    type: "photo";
}

export interface Audio {
    filename: string;
    timestamp: number;
    text: string;
}

export interface CalloutElements {
    overlayTop: string;
    overlayBottom: string;
    overlayLeft: string;
    overlayRight: string;
}
