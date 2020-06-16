# elmotron9000

This package is the bread and butter, the grand project, the big shabang.

*/slaps hood of npm module*

You can automate an entire video presentation workflow with this bad boy.

## Installing

To get started, install this package.

For npm, you can run

```sh
npm i @elmotron9000/elmotron9000
```

For yarn, you can run

```sh
yarn add @elmotron9000/elmotron9000
```

## Overview

Some notable underlying components to the project:

1. `@elmotron9000/tts`: use basic string inputs for your presentation script, and generate WaveNet audio clips
1. `@elmotron9000/fmlpeg`: the plumbing for all things video, audio, photos, and subtitles

The main project:

`@elmotron9000/elmotron9000` can be used to describe interactions with a web application- anything you can do
in your browser can be done with **elmotron9000**. Narrate your presentation, call out web components visually,
record interactions, generate video, and add subtitles.

## Example

```ts
import { Elmo } from "@elmotron9000/elmotron9000";

const PRODUCT_NAME = "Dynatrace";

async function demo() {
  const elmo = new Elmo({ videoFile: "./example.mp4", subtitles: true });
  const dw = await elmo.startScene("https://www.dynatrace.com");
  
  // Show an intro slide using `reveal.js` and start recording
  await dw.showSlides(`
    <div class="reveal">
        <div class="slides">
            <section
                data-background-image="https://dt-cdn.net/images/slide-background-1872-ad726449a5.jpg">
                <h1 style="font-size: 48px; position: absolute; left: -60px; top: 230px; color: white">
                    The ${PRODUCT_NAME} Website
                </h1>
            </section>
        </div>
    </div>
  `);
  await dw.waitForSelector(".reveal.ready");
  await dw.startRecording();

  // Narrate the video at anytime by saying anything - you can also use more advanced SSML
  await dw.sleep(500);
  await dw.say(`Today I will be showing you how to get started with a free trial for ${PRODUCT_NAME}`)
  await dw.sleep(200);
  await dw.say(`First, head to the ${PRODUCT_NAME} website`);
  await dw.sleep(200);
  await dw.hideSlides();

  // Use content in the actual page for your script
  const page = dw.page();
  const startButtonSelector = "a.btn.btn--primary.btn--video";
  const startButton = await page.$(startButtonSelector);
  const startButtonText = await startButton.textContent();
  await dw.showCallout(startButtonSelector);
  await dw.say(`You can get started with Dynatrace today by clicking the ${startButtonText.trim()} button`);
  await dw.moveTo(startButtonSelector);
  await dw.hideCallout();

  // Stops the recording and closes the browser
  await dw.stop();

  // Add outro video
  await elmo.addScene({
    type: "video",
    filename: "./outro.mp4",
    audio: [],
  });

  // Build the video presentation
  await elmo.build();
}

demo();
```