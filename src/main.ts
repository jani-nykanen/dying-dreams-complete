import { Core } from "./core/core.js"
import { Game } from "./game/game.js";
import { StartIntro } from "./game/startintro.js";
import { StartScreen } from "./game/startscreen.js";
import { StoryScreen } from "./game/storyscreen.js";
import { TitleScreen } from "./game/titlescreen.js";
import { CoreEvent } from "./core/event.js";



window.onload = () => (new Core(160, 144))
        .addScene("game", new Game())
        .addScene("titlescreen", new TitleScreen())
        .addScene("story", new StoryScreen())
        .addScene("intro", new StartIntro())
        .addScene("start", new StartScreen())
        .run("start", (event : CoreEvent) => {

            event.assets.parseIndexFile("assets/index.json");

            event.input
                .addAction("undo", "Backspace", "KeyZ", 1)
                .addAction("restart", "KeyR", null, 3)
                .addAction("start", "Enter", null, 9, 7)
                .addAction("pause", "Enter", null, 9, 7)
                .addAction("select", "Space", null, 0);  
                
            event.audio.setGlobalVolume(0.50);
        });
