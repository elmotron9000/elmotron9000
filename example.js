const { Elmo } = require('./lib');

(async () => {
    const elmo = new Elmo({ videoFile: "./example.mp4", subtitles: true });

    await Promise.all([
        makeWikiScene(elmo),
        makeDdgScene(elmo)
    ]);

    await elmo.build();
})();

async function makeDdgScene(elmo) {
    const ddgScene = await elmo.startScene('https://duckduckgo.com');
    await ddgScene.waitForSelector("#search_form_input_homepage");
    await ddgScene.startRecording();
    await ddgScene.sleep(1000);
    await ddgScene.say("maybe duck duck go can help me");
    await ddgScene.click("#search_form_input_homepage");
    ddgScene.say("drink bleach kill virus or no");
    await ddgScene.type("drink bleach kill virus or no");
    await ddgScene.click("#search_button_homepage");
    await ddgScene.waitForSelector("#links");
    await ddgScene.say("guess not");
    await ddgScene.stop();
}

async function makeWikiScene(elmo) {
    const wikiScene = await elmo.startScene('https://www.wikipedia.org/');

    await wikiScene.waitForSelector('#searchInput');
    await wikiScene.startRecording();
    await wikiScene.moveTo('#searchInput');
    await wikiScene.say("first I will search for something");
    await wikiScene.sleep(1000);
    await wikiScene.click();
    wikiScene.say("drink bleach kill virus or no");
    await wikiScene.type("drink bleach kill virus or no");
    await wikiScene.moveTo(".pure-button-primary-progressive");
    await wikiScene.click();
    await wikiScene.say("thought for sure this would return something");
    await wikiScene.stop();
}
