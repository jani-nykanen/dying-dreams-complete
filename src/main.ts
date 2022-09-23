import { Core } from "./core/core.js"
import { Game } from "./game/game.js";
import { Ramp } from "./audio/sample.js";
import { StartIntro } from "./game/startintro.js";
import { StartScreen } from "./game/startscreen.js";
import { StoryScreen } from "./game/storyscreen.js";
import { TitleScreen } from "./game/titlescreen.js";
import { CoreEvent } from "./core/event.js";



const constructSamples = (event : CoreEvent) : void => {

    event.assets.addSample("die",
        event.audio.createSample(
            [[192, 4], [144, 8], [128, 12]],
            0.70, "square", Ramp.Exponential, 0.20
        ));
    event.assets.addSample("climb",
        event.audio.createSample(
            [[160, 4]],
            0.70, "square", Ramp.Instant));
    event.assets.addSample("toggle1",
        event.audio.createSample(
            [[160, 4], [192, 12]],
            0.70, "square", Ramp.Instant, 0.35));
    event.assets.addSample("toggle2",
        event.audio.createSample(
            [[192, 4], [160, 12]],
            0.70, "square", Ramp.Instant, 0.35));       
    event.assets.addSample("rumble",
        event.audio.createSample(
            [[224, 4], [160, 4], [192, 4], [160, 4],  [128, 12]],
            0.80, "sawtooth", Ramp.Linear, 0.20
        ));  
    event.assets.addSample("boulder",
        event.audio.createSample(
            [[144, 8]],
            1.0, "triangle", Ramp.Exponential, 0.20
        ));    
    event.assets.addSample("victory",
        event.audio.createSample(
            [[128, 12], [144, 12], [160, 12], [176, 12], [192, 12], [208, 60]],
            0.60, "sawtooth", Ramp.Instant, 0.10
        ));

    event.assets.addSample("choose",
        event.audio.createSample(
            [[160, 6]],
            0.70, "square", Ramp.Instant));
    event.assets.addSample("select",
        event.audio.createSample(
            [[192, 10]],
            0.70, "square", Ramp.Instant, 0.30));
    event.assets.addSample("pause",
        event.audio.createSample(
            [[128, 4], [144, 6]],
            0.70, "square", Ramp.Exponential));    
}



window.onload = () => (new Core(160, 144))
        .addScene("game", new Game())
        .addScene("titlescreen", new TitleScreen())
        .addScene("story", new StoryScreen())
        .addScene("intro", new StartIntro())
        .addScene("start", new StartScreen())
        .run("start", (event : CoreEvent) => {

            constructSamples(event);

            event.assets.parseIndexFile("assets/index.json");

            event.input
                .addAction("undo", "Backspace", "KeyZ", 1)
                .addAction("restart", "KeyR", null, 3)
                .addAction("start", "Enter", null, 9, 7)
                .addAction("pause", "Enter", null, 9, 7)
                .addAction("select", "Space", null, 0);  
            event.audio.setGlobalVolume(0.50);
        });
