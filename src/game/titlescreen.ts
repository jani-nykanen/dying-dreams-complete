import { Canvas, TextAlign } from "../renderer/canvas.js";
import { InputState } from "../core/inputstate.js";
import { Menu, MenuButton } from "./menu.js";
import { TransitionType } from "../core/transition.js";
import { Scene, SceneParam } from "../core/scene.js";
import { CoreEvent } from "../core/event.js";


export class TitleScreen implements Scene {


    private startMenu : Menu
    private phase = 0;
    private enterTimer = 29;
    private waveTimer = 0;
    private batTimers : Array<number>;


    constructor() {

        this.batTimers = (new Array<number> (7)).fill(0.0);

        this.startMenu = new Menu(
            [
                new MenuButton("New Game", (event : CoreEvent) => {

                    this.startGame(event);
                }),
                new MenuButton("Continue", (event : CoreEvent) => {

                    let index = 1;
                    try {

                        index = Math.max(Number(window.localStorage.getItem("dying_dreams_complete_save")), 1);
                    }
                    catch (e) {

                        console.log(e);
                        index = 1;
                    }
                    this.startGame(event, index);
                }),
                new MenuButton("AUDIO: OFF", (event : CoreEvent) => {

                    event.audio.toggle();
                    this.startMenu.changeButtonText(2, event.audio.getStateString());
                })
            ], true);
    }

    
    private startGame(event : CoreEvent, index = 1) : void {

        event.transition.activate(true, TransitionType.Circle, 1.0/30.0,
            (event : CoreEvent) => {

                if (index > 1) {

                    event.changeScene("game", index);
                }
                else {

                    event.changeScene("story", 0);
                    event.transition.deactivate();
                }
            });
    }


    private drawLogo(canvas : Canvas) : void {

        const AMPLITUDE = 16;

        let font = canvas.getBitmap("font");
        let logo = canvas.getBitmap("logo");
        if (logo == undefined)
            return;

        canvas.drawVerticallyWavingBitmap(logo, 
            canvas.width/2 - logo.width/2, 32, 
            this.waveTimer, Math.PI*2, AMPLITUDE/logo.height);
        canvas.setColor(255, 255, 170)
               .drawText(font, "(In)complete Edition", 
               canvas.width/2, 336, 
               -24, 0, TextAlign.Center, 0.5, 0.5);

    }


    private drawBats(canvas : Canvas) : void {

        const POS_Y = [32, 80, 96, 64, 120, 76, 48];
        const POS_X = [32, 16, 56, 72, 108, 128, 144];
        const AMPLITUDE = [4, 8, 6, 16, 6, 12, 4];

        let bmp = canvas.getBitmap("bat");
        let dx : number;
        let dy : number;

        let frame : number;
        let w : number;

        for (let i = 0; i < POS_X.length; ++ i) {

            dx = (Math.round((POS_X[i]*5 - 48 + this.batTimers[i])) % (176*5)) - 96;
            w = this.waveTimer + i * (Math.PI*2 / 6);
            dy = POS_Y[i]*5 - 20 + Math.round(Math.sin(w) * AMPLITUDE[i] *5);

            frame = (this.batTimers[i] % 16) < 8 ? 0 : 1;

            canvas.drawBitmapRegion(bmp, 0, frame*48, 96, 48, dx, dy);
        }
    }


    public init(param : SceneParam, event : CoreEvent) : void {

        this.startMenu.activate(0);
        this.startMenu.changeButtonText(2, event.audio.getStateString());

        if (param != null) {

            this.phase = Number(param);
            if (this.phase == 1) {

                this.startMenu.activate(1);
            }
        }
    }


    public update(event : CoreEvent) : void {

        const WAVE_SPEED = Math.PI / 60;
        const BAT_SPEED = [0.30, 0.5, 0.33, 0.75, 0.40, 0.60, 0.25];

        this.waveTimer = (this.waveTimer + WAVE_SPEED*event.step) % (Math.PI*2);

        for (let i = 0; i < this.batTimers.length; ++ i) {
            
            this.batTimers[i] = (this.batTimers[i] + 2.0*BAT_SPEED[i]*event.step) % (event.screenWidth+96);
        }

        if (event.transition.isActive())
            return;

        if (this.phase == 0) {

            if (event.input.getAction("start") == InputState.Pressed ||
                event.input.getAction("select") == InputState.Pressed) {

                event.audio.playSample(event.assets.getSample("pause"), 0.60);
                ++ this.phase;
            }

            this.enterTimer = (this.enterTimer + event.step) % 60;
        }
        else {
            
            this.startMenu.update(event);
        }
    }


    public redraw(canvas : Canvas) : void {

        let font = canvas.getBitmap("font");

        canvas.drawBitmap(canvas.getBitmap("background"), 0, -8)
              .setColor(0, 0, 0, 0.33)
              .fillRect()
              .setColor();

        this.drawBats(canvas);
              
        canvas.drawText(font, "(c)2022 Jani Nyk@nen",
                    canvas.width/2, canvas.height-36, 
                    -24, 0, TextAlign.Center, 0.5, 0.5);

        let alpha : number;
        if (this.phase == 0) {
    
            alpha = Math.abs(this.enterTimer - 30) / 30.0;
            canvas.setColor(255, 255, 85, alpha)
                  .drawText(font, "Press ENTER",
                            canvas.width/2, canvas.height/2 + 160, -24, 0, TextAlign.Center, 0.75, 0.75);
            canvas.setColor();
            
        }
        else {

            this.startMenu.draw(canvas, 0, 176);
        }
        this.drawLogo(canvas);
    }


    public onChange() : any {

        return null;
    }

}
