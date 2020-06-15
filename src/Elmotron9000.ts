import { performance } from "perf_hooks";
import { chromium, Page, WebKitBrowser } from "playwright";
import { PageVideoCapture, saveVideo } from "playwright-video";
import { BoundingBox } from "./types";
import { installMouseHelper } from "./utils/install-mouse-helper";
import { snackbarStyle } from "./utils/snackbar-style";

export interface Config {
    videoFile: string;
}

export interface CalloutElements {
    focusedElement: string;
    highlight: string;
    overlay: string;
}

export class Elmotron9000 {
    private _page!: Page;
    private _browser!: WebKitBrowser;
    private _video!: PageVideoCapture;

    private _startTimeStamp: number = -1;

    private _callout?: CalloutElements;

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

    public async toast(text: string) {
        await this._page.evaluate(([text, style]) => {
            const snackbar = document.createElement("div");
            snackbar.id = "snackbar";
            snackbar.innerHTML = text;

            const styleElement = document.createElement("style");
            styleElement.id = "snackbar-style"
            styleElement.innerHTML = style;

            document.head.appendChild(styleElement);
            document.body.appendChild(snackbar);
        }, [text, snackbarStyle])

        await this._page.$eval("#snackbar", e => { e.classList.add("show"); })
        await new Promise(resolve => setTimeout(resolve, 500 + readingTime(text)));
        await this._page.$eval("#snackbar", e => { e.classList.remove("show"); })
        await new Promise(resolve => setTimeout(resolve, 500));
        await this._page.$eval("#snackbar", e => { e.parentNode?.removeChild(e); })
        await this._page.$eval("#snackbar-style", e => { e.parentNode?.removeChild(e); })
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
            highlight.id = "calloutHighlight";
            document.body.appendChild(highlight);
    
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

        await this._page.$eval(focusedElement, e => e.style.zIndex = "");
        await this._page.$eval(overlay, e => e.remove());
        await this._page.$eval(highlight, e => e.remove());

        this._callout = undefined;
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

function readingTime(text: string) {
    const wordsPerMinute = 200;
    const noOfWords = text.split(/\s/g).length;
    return (noOfWords / wordsPerMinute) * 60 * 1000;
  }