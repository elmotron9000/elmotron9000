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
        this._browser = await chromium.launch({ slowMo: 41.666, headless: this._config.headless });

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
        await this.sleep(1000);
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

    public async showCallout(selector: string) {
        if (this._callout) {
            await this.hideCallout();
        }

        const overlay = await this._page.$eval(selector, (focusedElement: HTMLElement) => {
            const offset = 8;
            const rect = focusedElement.getBoundingClientRect();
            const overlayTop = document.createElement("div");
            const overlayBottom = document.createElement("div");
            const overlayLeft = document.createElement("div");
            const overlayRight = document.createElement("div");

            overlayTop.style.top = "0px";
            overlayTop.style.bottom = `${window.innerHeight - rect.top + offset}px`;
            overlayTop.style.left = "0px";
            overlayTop.style.right = "0px";
            overlayTop.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
            overlayTop.style.zIndex = "999";
            overlayTop.style.position = "fixed";
            overlayTop.style.opacity = "0";
            overlayTop.style.transition = "opacity 250ms";
            overlayTop.id = "overlayTop";
            document.body.appendChild(overlayTop);

            overlayBottom.style.top = `${rect.bottom + offset}px`;
            overlayBottom.style.bottom = "0px";
            overlayBottom.style.left = "0px";
            overlayBottom.style.right = "0px";
            overlayBottom.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
            overlayBottom.style.zIndex = "999";
            overlayBottom.style.position = "fixed";
            overlayBottom.style.opacity = "0";
            overlayBottom.style.transition = "opacity 250ms";
            overlayBottom.id = "overlayBottom";
            document.body.appendChild(overlayBottom);


            overlayLeft.style.top = `${rect.top - offset}px`;
            overlayLeft.style.bottom = `${window.innerHeight - rect.bottom - offset}px`;
            overlayLeft.style.left = `0px`;
            overlayLeft.style.right = `${window.innerWidth - rect.left + offset}px`;
            overlayLeft.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
            overlayLeft.style.zIndex = "999";
            overlayLeft.style.position = "fixed";
            overlayLeft.style.opacity = "0";
            overlayLeft.style.transition = "opacity 250ms";
            overlayLeft.id = "overlayLeft";
            document.body.appendChild(overlayLeft);

            overlayRight.style.top = `${rect.top - offset}px`;
            overlayRight.style.bottom = `${window.innerHeight - rect.bottom - offset}px`;
            overlayRight.style.left = `${rect.right + offset}px`;
            overlayRight.style.right = "0px";
            overlayRight.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
            overlayRight.style.zIndex = "999";
            overlayRight.style.position = "fixed";
            overlayRight.style.opacity = "0";
            overlayRight.style.transition = "opacity 250ms";
            overlayRight.id = "overlayRight";
            document.body.appendChild(overlayRight);

            overlayTop.style.opacity = "1";
            overlayBottom.style.opacity = "1";
            overlayLeft.style.opacity = "1";
            overlayRight.style.opacity = "1";

            return {
                overlayTop: `${overlayTop.id}`,
                overlayBottom: `${overlayBottom.id}`,
                overlayLeft: `${overlayLeft.id}`,
                overlayRight: `${overlayRight.id}`,
            };
        });

        this._callout = {
            ...overlay
        };
    }

    public async hideCallout() {
        if (!this._callout) {
            return;
        }

        await this._page.evaluate(({ overlayTop, overlayBottom, overlayLeft, overlayRight }) => {
            console.log(overlayTop, overlayBottom, overlayLeft, overlayRight);
            const elements = [
                document.getElementById(overlayTop),
                document.getElementById(overlayBottom),
                document.getElementById(overlayLeft),
                document.getElementById(overlayRight),
            ];

            elements.forEach(el => el!.style.opacity = "0");
        }, this._callout);

        await this.sleep(250);

        await this._page.evaluate(({ overlayTop, overlayBottom, overlayLeft, overlayRight }) => {
            const elements = [
                document.getElementById(overlayTop),
                document.getElementById(overlayBottom),
                document.getElementById(overlayLeft),
                document.getElementById(overlayRight),
            ];

            elements.forEach(el => el!.remove());
        }, this._callout);

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

    public async installMouseHelper() {
        return installMouseHelper(this._page);
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