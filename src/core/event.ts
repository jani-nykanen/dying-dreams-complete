import { Assets } from "../io/assets.js";
import { AudioPlayer } from "../audio/audioplayer.js";
import { Canvas } from "../renderer/canvas.js";
import { Keyboard } from "./keyboard.js";
import { Transition } from "./transition.js";
import { Core } from "./core.js";
import { SceneParam } from "./scene.js";


export class CoreEvent {


    public readonly keyboard : Keyboard;
    public readonly audio : AudioPlayer;
    public readonly transition : Transition;
    public readonly assets : Assets;

    public readonly step = 1.0;

    private readonly canvas : Canvas;
    private readonly core : Core;


    constructor(keyboard : Keyboard, audio : AudioPlayer, canvas : Canvas, 
        transition : Transition, assets : Assets, core : Core) {

        this.keyboard = keyboard;
        this.audio = audio;
        this.canvas = canvas;
        this.transition = transition;
        this.assets = assets;
        this.core = core;
    }


    public get screenWidth() : number { 
        
        return this.canvas.width; 
    }
    public get screenHeight() : number { 
        
        return this.canvas.height; 
    }


    public changeScene(name : string, param : SceneParam = 0) : void {

        this.core.changeScene(name, param);
    }
}
