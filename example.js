const { Elmo } = require('./lib');

(async () => {
    const elmo = new Elmo({ videoFile: "./example.mp4", subtitles: true });
    
    const wikiScene = await elmo.startScene('https://www.wikipedia.org/');
    const ddgScene = await elmo.startScene('https://duckduckgo.com');

    await Promise.all([
        makeWikiScene(wikiScene),
        makeDdgScene(ddgScene)
    ]);

    await elmo.build();
})();

async function makeDdgScene(scene) {
    await scene.waitForSelector("#search_form_input_homepage");
    await scene.startRecording();
    await scene.sleep(1000);
    await scene.say("maybe duck duck go can help me");
    await scene.click("#search_form_input_homepage");
    scene.say("drink bleach kill virus or no");
    await scene.type("drink bleach kill virus or no");
    await scene.click("#search_button_homepage");
    await scene.waitForSelector("#links");
    await scene.say("guess not");
    await scene.stop();
}

async function makeWikiScene(scene) {
    await scene.waitForSelector('#searchInput');
    await scene.startRecording();
    await scene.moveTo('#searchInput');
    await scene.say("first I will search for something");
    await scene.sleep(1000);
    await scene.click();
    scene.say("drink bleach kill virus or no");
    await scene.type("drink bleach kill virus or no");
    await scene.moveTo(".pure-button-primary-progressive");
    await scene.click();
    await scene.say("thought for sure this would return something");
    await scene.stop();
}
