import { getLengthOfFile } from '@elmotron9000/fmlpeg';
import { getAudio } from '@elmotron9000/tts';
import { performance } from "perf_hooks";
import { chromium, Page, WebKitBrowser } from "playwright";
import { PageVideoCapture, saveVideo } from "playwright-video";
import { RetryableError } from './retryable-error';
import { BoundingBox, CalloutElements, Config, VideoMetadata } from "./types";
import { installMouseHelper } from "./utils/install-mouse-helper";

export class Elmotron9000 {
    private _page!: Page;
    private _browser!: WebKitBrowser;
    private _video!: PageVideoCapture;

    private _startTimeStamp: number = -1;

    private metadata: VideoMetadata;
    private _callout?: CalloutElements;

    constructor(private _config: Config) {
        this.metadata = {
            filename: _config.videoFile,
            type: "video",
            audio: []
        }
    }

    public async init(page: string) {
        this._browser = await chromium.launch({ slowMo: 41.666 });

        this._page = await this._browser.newPage();
        await this._page.goto(page, { waitUntil: "domcontentloaded" });
    }

    public async startRecording() {
        await installMouseHelper(this._page);
        this._video = await saveVideo(this._page, this._config.videoFile);
        this._startTimeStamp = performance.now();
    }

    public async moveTo(selector: string) {
        await installMouseHelper(this._page);
        const position = await this._getElementPosition(selector);
        const [x, y] = [position.x + (position.width / 2), position.y + (position.height / 2)];

        await this._page.mouse.move(x, y, {
            steps: 24
        });
        await this.sleep(200);
    }

    public async click(selector?: string) {
        await installMouseHelper(this._page);
        if (selector) {
            await this.moveTo(selector);
        }

        await this._page.mouse.down();
        await this._page.mouse.up();
        await this.sleep(200);
    }

    public async type(str: string) {
        await installMouseHelper(this._page);
        for (const key of str) {
            await this._page.keyboard.press(key);
        }
        await this.sleep(200);
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

        const readingTimeSeconds = await getLengthOfFile(audio.path);

        if (!readingTimeSeconds) {
            throw new Error(`Could not read audio length ${audio.path}`);
        }

        const readingTime = readingTimeSeconds * 1000;

        this.log(`reading time: ${readingTime}`)
        const waitTime = readingTime - dltime;
        this.log(`remaining wait time: ${waitTime}`)
        if (waitTime < 0) {
            throw new RetryableError("Took too long to download file");
        }
        await this.sleep(waitTime);
    }

    public async showCallout(query: string) {
        if (this._callout) {
            await this.hideCallout();
        }

        const overlay = await this._page.$eval(query, (focusedElement: HTMLElement) => {
            focusedElement.style.zIndex = "1001";
            const highlight = document.createElement("div");
            const overlay = document.createElement("div");

            overlay.style.top = "0px";
            overlay.style.bottom = "0px";
            overlay.style.left = "0px";
            overlay.style.right = "0px";
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
            overlay.style.zIndex = "999";
            overlay.style.position = "fixed";
            overlay.style.opacity = "0";
            overlay.style.transition = "opacity 250ms";
            overlay.id = "calloutOverlay";
            document.body.appendChild(overlay);

            const rect = focusedElement.getBoundingClientRect();

            highlight.style.position = "absolute";
            highlight.style.left = `${rect.left - 4}px`;
            highlight.style.top = `${rect.top - 4}px`;
            highlight.style.width = `${rect.width + 8}px`;
            highlight.style.height = `${rect.height + 8}px`;
            highlight.style.backgroundColor = "white";
            highlight.style.zIndex = "1000";
            highlight.style.opacity = "0";
            highlight.style.transition = "opacity 250ms";
            highlight.id = "calloutHighlight";
            document.body.appendChild(highlight);

            overlay.style.opacity = "1";
            highlight.style.opacity = "1";

            return {
                highlight: `#${highlight.id}`,
                overlay: `#${overlay.id}`
            };
        });

        this._callout = {
            focusedElement: query,
            ...overlay
        };
    }

    public async hideCallout() {
        if (!this._callout) {
            return;
        }

        const { focusedElement, highlight, overlay } = this._callout;

        await this._page.$eval(overlay, e => e.style.opacity = "0");
        await this._page.$eval(highlight, e => e.style.opacity = "0");
        await this.sleep(250);

        await this._page.$eval(overlay, e => e.remove());
        await this._page.$eval(highlight, e => e.remove());

        await this._page.$eval(focusedElement, e => e.style.zIndex = "");

        this._callout = undefined;
    }

    public async sleep(ms: number) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    public async waitForSelector(selector: string) {
        return this._page.waitForSelector(selector);
    }

    public page() {
        return this._page;
    }

    public getElement(selector: string) {
        return this._page.$(selector);
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
        if (this._startTimeStamp === -1) {
            return 0;
        }
        const now = Math.round(performance.now() - this._startTimeStamp);
        return now / 1000;
    }
}

// function getReadingTime(text: string) {
//     const wordsPerMinute = 200;
//     const noOfWords = text.split(/\s/g).length;
//     return (noOfWords / wordsPerMinute) * 60 * 1000;
// }