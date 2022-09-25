import { Assets } from "../io/assets.js";
import { AudioPlayerGeneral } from "../audio/audioplayer.js";
import { Canvas } from "../renderer/canvas.js";
import { Transition } from "./transition.js";
import { CoreEvent } from "./event.js";
import { Scene, SceneParam } from "./scene.js";
import { Input } from "./input.js";
import { Renderer } from "../renderer/renderer.js";



export class Core {


    private canvas : Canvas;
    private input : Input;
    private audio : AudioPlayerGeneral;
    private assets : Assets;
    private transition : Transition;
    private renderer : Renderer;
    private event : CoreEvent;

    private scenes : Map<string, Scene>;
    private activeScene : Scene | undefined = undefined;

    private timeSum = 0.0;
    private oldTime = 0.0;


    constructor(canvasWidth : number, canvasHeight : number) {

        this.renderer = new Renderer();
        this.audio = new AudioPlayerGeneral();
        this.assets = new Assets(this.audio, this.renderer);
        this.canvas = new Canvas(this.renderer, canvasWidth, canvasHeight, this.assets);
        this.transition = new Transition();
        this.input = new Input();

        this.event = new CoreEvent(
            this.input, this.audio, 
            this.canvas, this.transition, 
            this.assets, this);

        this.scenes = new Map<string, Scene> ();
    }


    private drawLoadingScreen(canvas : Canvas) : void {

        const OUTLINE = 4;
        const WIDTH = 256;
        const HEIGHT = 64;

        let p = this.assets.getLoadingPercentage();

        let dx = canvas.width/2 - WIDTH/2;
        let dy = canvas.height/2 - HEIGHT/2;

        canvas.clear(0, 85, 170);
        canvas.setColor()
              .fillRect(dx, dy, WIDTH, HEIGHT)
              .setColor(0, 85, 170)
              .fillRect(dx + OUTLINE, dy + OUTLINE, WIDTH - OUTLINE*2, HEIGHT - OUTLINE*2)
              .setColor()
              .fillRect(dx + OUTLINE*2, dy + OUTLINE*2, (WIDTH - OUTLINE*4)*p, HEIGHT - OUTLINE*4);
    }


    private loop(ts : number) : void {

        const MAX_REFRESH_COUNT = 5;
        const FRAME_WAIT = 16.66667 * this.event.step;

        this.timeSum += ts - this.oldTime;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_WAIT, this.timeSum);
        this.oldTime = ts;

        let refreshCount = (this.timeSum / FRAME_WAIT) | 0;
        while ((refreshCount --) > 0) {

            this.input.updateStick();

            if (this.activeScene != undefined &&
                this.assets.hasLoaded()) {

                this.activeScene.update(this.event);
            }

            this.input.update();
            this.transition.update(this.event);

            this.timeSum -= FRAME_WAIT;
        }

        this.canvas.drawTo((canvas : Canvas) => {

            if (!this.assets.hasLoaded()) {

                this.drawLoadingScreen(canvas);
            }
            else {

                if (this.activeScene != undefined)
                    this.activeScene.redraw(canvas);

                this.transition.draw(canvas);
            }

        });
        this.canvas.renderToScreen();

        window.requestAnimationFrame(ts => this.loop(ts));
    }


    public run(initialScene : string, 
        onstart : ((event : CoreEvent) => void) = () => {}) : void {

        this.activeScene = this.scenes.get(initialScene);
        if (this.activeScene != undefined) {

            this.activeScene.init(null, this.event);
        }

        onstart(this.event);
        this.loop(0);
    }


    public addScene(name : string,  scene : Scene) : Core {

        this.scenes.set(name, scene);
        return this;
    }


    public changeScene(name : string, param : SceneParam = 0) : void {

        let newScene = this.scenes.get(name);
        if (newScene == undefined) {

            throw "No scene with name: " + name;
        }

        newScene.init(param, this.event);
        this.activeScene = newScene;
    }
}
