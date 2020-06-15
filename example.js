const { chromium } = require('playwright');
const { Elmotron9000 } = require('./lib');

(async () => {
    const browser = await chromium.launch({
        headless: false
    });
    const elmo = new Elmotron9000(browser, { initialPage: 'http://whatsmyuseragent.org/', videoFile: "./example.mp4" });


    await elmo.start();
    await new Promise(resolve => setTimeout(resolve, 10000))
    await elmo.stop();
})();