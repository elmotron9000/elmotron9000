const { Elmotron9000 } = require('./lib');

(async () => {
  const elmo = new Elmotron9000({ videoFile: "./example2.mp4" });
  await elmo.init('https://assistant-dev.dynatracelabs.com');
  await elmo.waitForSelector("#email_verify")
  await elmo.startRecording();
  await elmo.say("Log into Davis Assistant using your Dynatrace account.");
  await elmo.moveTo('#email_verify');
  await elmo.click();
  await elmo.type("davis_one_tenant@ruxitlabs.com");
  await elmo.moveTo('#next_button');
  await elmo.click();
  // TODO sleep
  // await new Promise(resolve => setTimeout(resolve, 1000));
  // await elmo.moveTo('#searchInput');
  // await elmo.click();
  // await elmo.type("drink bleach kill virus or no");
  // await elmo.moveTo(".pure-button-primary-progressive")
  // await elmo.click();
  // await new Promise(resolve => setTimeout(resolve, 6000));
  const meta = await elmo.stop();
  console.log(meta);
})();