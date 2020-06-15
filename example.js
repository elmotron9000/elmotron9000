const { Elmotron9000 } = require('./lib');

(async () => {
    const elmo = new Elmotron9000({ videoFile: "./example.mp4" });

    await elmo.start('https://www.wikipedia.org/', '#searchInput');
    await elmo.say("first I will search for something")
    await new Promise(resolve => setTimeout(resolve, 1000));
    await elmo.moveTo('#searchInput');
    await elmo.click();
    await elmo.type("drink bleach kill virus or no");
    await elmo.moveTo(".pure-button-primary-progressive")
    await elmo.click();
    await new Promise(resolve => setTimeout(resolve, 6000));
    const meta = await elmo.stop();

    console.log(meta);
})();