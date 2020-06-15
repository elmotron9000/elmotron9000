import { performance } from "perf_hooks";
import { chromium, Page, WebKitBrowser } from "playwright";
import { PageVideoCapture, saveVideo } from "playwright-video";
import { BoundingBox } from "./types";
import { installMouseHelper } from "./utils/install-mouse-helper";

export interface Config {
    videoFile: string;
}

export class Elmotron9000 {
    private _page!: Page;
    private _browser!: WebKitBrowser;
    private _video!: PageVideoCapture;

    private _startTimeStamp: number = -1;

    constructor(private _config: Config) { }

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

        const length = (performance.now() - this._startTimeStamp) / 1000;
        await this._video.stop();

        await this._browser.close();
        console.log(`Wrote out a ${length} second video to ${this._config.videoFile}`);
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
}