import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/inputstate.js";
import { Menu, MenuButton } from "./menu.js";
import { Stage } from "./stage.js";
import { TransitionType } from "../core/transition.js";
import { Scene, SceneParam } from "../core/scene.js";
import { CoreEvent } from "../core/event.js";
import { RGBA } from "../common/rgba.js";


const HINTS = [
    "  HINT: Use \"Arrow Keys\" to move.",
    "  HINT: Press \"Backspace\" to undo.",
    "  HINT: Press \"R\" to restart.",
    "  HINT: Press \"Enter\" to Pause."
];
const HINT_XOFF = -24;
const HINT_SCALE = 0.75;


const MUSIC_VOL= 0.40;


export class Game implements Scene {


    private stage : Stage;
    private stageIndex = 1;
    
    private backgroundTimer : number = 0.0;

    private pauseMenu : Menu;

    private hintPos : number = 0.0;


    constructor() {

        this.pauseMenu = new Menu(
            [
                new MenuButton("Resume", () => this.pauseMenu.deactivate()),

                new MenuButton("Restart", () => {

                    this.stage.restart();
                    this.pauseMenu.deactivate();
                }),

                new MenuButton("Undo", () => {

                    this.stage.undo();
                    this.pauseMenu.deactivate();
                }),

                new MenuButton("Audio: On ", (event : CoreEvent) => {

                    if (event.audio.isEnabled()) {

                        event.audio.stopMusic();
                        event.audio.toggle(false);
                    }
                    else {

                        event.audio.toggle(true);
                        event.audio.fadeInMusic(event.assets.getSample("theme"), MUSIC_VOL, 1000);
                    }
                    this.pauseMenu.changeButtonText(3, event.audio.getStateString());
                }),

                new MenuButton("Quit", (event : CoreEvent) => {

                    event.audio.stopMusic();
                    this.pauseMenu.deactivate();
                    event.transition.activate(true, TransitionType.Fade,
                        1.0/30.0, () => {
                            event.changeScene("titlescreen", 1);
                        });
                })
            ]
        );
    }


    private drawBackground(canvas : Canvas) : void {

        let bmp = canvas.getBitmap("background");
        if (bmp == undefined)
            return;

        canvas.drawVerticallyWavingBitmap(bmp, 0, -10, this.backgroundTimer, Math.PI*6, 10.0 / bmp.height);
    }


    private drawBase(canvas : Canvas) : void {

        const SHADOW_OFF = 6;
        const SHADOW_ALPHA = 0.33;

        this.drawBackground(canvas);

        // Shadows
        canvas.setColor(0, 0, 0, 1);
        canvas.toggleSilhouetteRendering(true);
        canvas.move(SHADOW_OFF, SHADOW_OFF);
        this.stage.drawObjectsWithShadow(canvas, true);
        canvas.toggleSilhouetteRendering(false);
        canvas.moveTo();
        
        canvas.setColor(255, 255, 255, 1.0 - SHADOW_ALPHA);
        this.drawBackground(canvas);

        canvas.setColor();
        this.stage.drawObjectsWithShadow(canvas);
        this.stage.drawObjectsWithoutShadow(canvas);
    }


    public init(param : SceneParam, event: CoreEvent) : void {

        this.stageIndex = 1;

        this.pauseMenu.changeButtonText(3, event.audio.getStateString());
        if (param != null) {

            this.stageIndex = Number(param);
        }
        this.stage = new Stage(this.stageIndex, event);

        this.hintPos = 0;

        event.audio.fadeInMusic(event.assets.getSample("theme"), MUSIC_VOL, 1000);
    }


    public update(event : CoreEvent) : void {

        const BACKGROUND_SPEED = 0.025;
        const HINT_SPEED = 2.0;

        if (!this.pauseMenu.isActive()) {
            
            this.stage.updateBackground(event);
            this.backgroundTimer = (this.backgroundTimer + BACKGROUND_SPEED*event.step) % (Math.PI*2);
        }

        if (event.transition.isActive())
            return;

        if (this.pauseMenu.isActive()) {

            this.pauseMenu.update(event);
            return;
        }
        else if (this.stage.canBeInterrupted() &&
            event.input.getAction("pause") == InputState.Pressed) {

            event.audio.playSample(event.assets.getSample("pause"), 0.60);
            this.pauseMenu.activate(0);
            return;
        }

        if (this.stageIndex <= HINTS.length) {

            this.hintPos = (this.hintPos + HINT_SPEED*event.step) % (HINTS[this.stageIndex-1].length * (64 + HINT_XOFF) * HINT_SCALE);
        }

        if (this.stage.update(event, event.assets)) {

            event.transition.activate(true, TransitionType.Circle, 1.0/30.0,
            () => {

                try {

                    window.localStorage.setItem("dying_dreams_complete_save", String(this.stageIndex+1));
                }
                catch (e) {

                    console.log(e);
                }
                ++ this.stageIndex;
                this.stage.changeStage(this.stageIndex, event);
                this.hintPos = 0;

                 event.audio.resumeMusic();
            });
        } 

        if (this.stage.isBedDead()) {

            event.audio.stopMusic();
            event.transition.activate(true, TransitionType.Fade, 1.0/120.0, (event : CoreEvent) => {

                event.transition.activate(false, TransitionType.Fade, 1.0/30.0, () => {}, RGBA.white());
                event.changeScene("story", 1);

            }, RGBA.white());
        }
    }


    public redraw(canvas : Canvas) : void {

        this.drawBase(canvas);

        if (this.pauseMenu.isActive()) {

            canvas.setColor(0, 0, 0, 0.33)
                  .fillRect()
                  .setColor();
            this.pauseMenu.draw(canvas);
        }

        // TODO: Separate function for this!
        if (this.stageIndex <= HINTS.length) {

            canvas.setColor(0, 0, 0, 0.33)
                  .fillRect(0, 0, canvas.width, 48)
                  .setColor();
            for (let i = 0; i < 2; ++ i) {

                canvas.drawText(
                    canvas.getBitmap("font"), HINTS[this.stageIndex-1], 
                    -Math.floor(this.hintPos) + i * HINTS[this.stageIndex-1].length*(64 + HINT_XOFF)*HINT_SCALE, 
                    2, HINT_XOFF, 0,
                    TextAlign.Left, HINT_SCALE, HINT_SCALE);
            }
        }
    }
}
