const { chromium } = require('playwright');
const { Elmotron9000 } = require('./lib');

(async () => {
    const browser = await chromium.launch({
        slowMo: 41.666,
    });
    const elmo = new Elmotron9000(browser, { initialPage: 'https://www.wikipedia.org/', videoFile: "./example.mp4" });


    await elmo.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await elmo.moveTo('#searchInput');
    await elmo.click();
    await elmo.type("drink bleach kill virus or no");
    await new Promise(resolve => setTimeout(resolve, 200));
    await elmo.moveTo(".pure-button-primary-progressive")
    await new Promise(resolve => setTimeout(resolve, 200));
    await elmo.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await elmo.stop();
})();