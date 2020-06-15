import { performance } from "perf_hooks";
import { Page, WebKitBrowser } from "playwright";
import { PageVideoCapture, saveVideo } from "playwright-video";

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
        await this._page.goto(this._config.initialPage);
        this._startTimeStamp = performance.now();
        this._video = await saveVideo(this._page, this._config.videoFile);
    }

    public async end() {
        if (!this._video || !this._page || this._startTimeStamp === -1) {
            throw new Error("Must start before you can end");
        }

        await this._video.stop();
        const length = 1000 * (performance.now() - this._startTimeStamp);

        console.log(`Wrote out a ${length} second video to ${this._config.videoFile}`);
    }
}