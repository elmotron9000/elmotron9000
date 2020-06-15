const { Elmotron9000 } = require('./lib');
const { SceneBuilder } = require("@elmotron9000/fmlpeg");

(async () => {
    const elmo = new Elmotron9000({ videoFile: "./example.mp4" });

    await elmo.init('https://www.wikipedia.org/');
    await elmo.waitForSelector('#searchInput');
    await elmo.startRecording();
    await elmo.moveTo('#searchInput');
    await elmo.say("first I will search for something")
    await elmo.sleep(1000);
    await elmo.click();
    await elmo.type("drink bleach kill virus or no");
    await elmo.moveTo(".pure-button-primary-progressive")
    await elmo.click();
    await elmo.say("thought for sure this would return something")
    const scene1 = await elmo.stop();

    const builder = new SceneBuilder([]); 
    builder.addScene(scene1);

    await builder.build({
        filename: "out.mp4"
    });
})();