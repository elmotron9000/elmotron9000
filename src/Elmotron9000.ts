import { getAudio } from '@elmotron9000/tts';
import { performance } from "perf_hooks";
import { chromium, Page, WebKitBrowser } from "playwright";
import { PageVideoCapture, saveVideo } from "playwright-video";
import { BoundingBox, VideoMetadata, Config } from "./types";
import { installMouseHelper } from "./utils/install-mouse-helper";
import { snackbarStyle } from "./utils/snackbar-style";
import { RetryableError } from './retryable-error';


export class Elmotron9000 {
    private _page!: Page;
    private _browser!: WebKitBrowser;
    private _video!: PageVideoCapture;

    private _startTimeStamp: number = -1;

    private metadata: VideoMetadata;

    constructor(private _config: Config) {
        this.metadata = {
            filename: _config.videoFile,
            type: "video",
            audio: []
        }
    }

    public async start(page: string, waitForSelector: string) {
        this._browser = await chromium.launch({ slowMo: 41.666 });

        this._page = await this._browser.newPage();
        await this._page.goto(page, {
            waitUntil: "domcontentloaded"
        });

        await installMouseHelper(this._page);

        await this._page.waitForSelector(waitForSelector);

        this._video = await saveVideo(this._page, this._config.videoFile);
        this._startTimeStamp = performance.now();
    }

    public async moveTo(selector: string) {
        const position = await this._getElementPosition(selector);
        const [x, y] = [position.x + (position.width / 2), position.y + (position.height / 2)];

        await this._page.mouse.move(x, y, {
            steps: 24
        });
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    public async click(selector?: string) {
        if (selector) {
            await this.moveTo(selector);
        }

        await this._page.mouse.down();
        await this._page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    public async type(str: string) {
        for (const key of str) {
            await this._page.keyboard.press(key);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    public async stop() {
        if (!this._video || !this._page || this._startTimeStamp === -1) {
            throw new Error("Must start before you can stop");
        }

        this.log('done');
        await this._video.stop();

        await this._browser.close();
        return this.metadata;
    }

    public async say(text: string) {
        const readingTime = getReadingTime(text);
        this.log("downloading text");
        const dlStart = performance.now();
        const audio = await getAudio(text);
        this.metadata.audio.push({
            filename: audio.path,
            timestamp: this.now(),
            text
        });
        const dltime = performance.now() - dlStart;
        this.log(`downloaded in ${dltime} ms`);
        const waitTime = readingTime - dltime;
        if (waitTime < 0) {
            throw new RetryableError("Took too long to download file");
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    public async _getElementPosition(selector: string): Promise<BoundingBox> {
        let elem = await this._page.$(selector);

        if (!elem) {
            throw new Error(`Could not find element: ${selector}`);
        }

        const box = await elem.boundingBox();

        if (!box) {
            throw new Error(`Could not get bounding box for element: ${selector}`)
        }

        return box;
    }

    public async _dimensions() {
        return this._page.evaluate(() => {
            return {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
                deviceScaleFactor: window.devicePixelRatio
            }
        });
    }

    private log(msg: string) {
        const s = this.now();
        console.log(`${s.toFixed(3).padStart(8)}: ${msg}`)
    }

    /** Time since the start of the video in seconds */
    private now() {
        const now = Math.round(performance.now() - this._startTimeStamp);
        return now / 1000;
    }
}

function getReadingTime(text: string) {
    const wordsPerMinute = 200;
    const noOfWords = text.split(/\s/g).length;
    return (noOfWords / wordsPerMinute) * 60 * 1000;
}