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

export interface VideoSceneMetadata {
    filename: string;
    audio: Audio[];
    type: "video";
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
