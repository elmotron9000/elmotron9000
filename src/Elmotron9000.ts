import { performance } from "perf_hooks";
import { Page, WebKitBrowser } from "playwright";
import { PageVideoCapture, saveVideo } from "playwright-video";
import {installMouseHelper} from "./utils/install-mouse-helper";

export interface Config {
    initialPage: string;
    videoFile: string;
}

export class Elmotron9000 {
    private _page?: Page;
    private _video?: PageVideoCapture;

    private _startTimeStamp: number = -1;

    constructor(private _browser: WebKitBrowser, private _config: Config) { }

    public async start() {
        this._page = await this._browser.newPage();
        await this._page.goto(this._config.initialPage, {
            waitUntil: "domcontentloaded"
        });

        await installMouseHelper(this._page);

        this._video = await saveVideo(this._page, this._config.videoFile);
        this._startTimeStamp = performance.now();
    }

    public async stop() {
        if (!this._video || !this._page || this._startTimeStamp === -1) {
            throw new Error("Must start before you can stop");
        }

        const length = (performance.now() - this._startTimeStamp) / 1000;
        await this._video.stop();

        await this._browser.close();
        console.log(`Wrote out a ${length} second video to ${this._config.videoFile}`);
    }
}