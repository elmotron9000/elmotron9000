import { SceneBuilder } from "@elmotron9000/fmlpeg";
import { Scene } from "./Scene";
import { Config, SceneMetadata } from "./types";

export class Elmo {
    private _sceneBuilder = new SceneBuilder([]);

    constructor(public config: Config) {}

    public startScene(initialPage: string) {
        return Scene.init(this, this.config, initialPage);
    }

    public addScene(scene: SceneMetadata) {
        this._sceneBuilder.addScene(scene);
    }

    public async build() {
        await this._sceneBuilder.build({
            filename: this.config.videoFile,
            subtitles: this.config.subtitles,
        });

        console.log(`Wrote ${this.config.videoFile}`);
    }
}