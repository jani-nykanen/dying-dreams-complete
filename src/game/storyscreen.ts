import { Canvas, TextAlign } from "../renderer/canvas";
import { TransitionType } from "../core/transition.js";
import { Scene, SceneParam } from "../core/scene";
import { CoreEvent } from "../core/event";


const STORY = [
    [
        "You are having\nthe same\ndream again.",
        "The dream where\neveryone must\ndie."
    ],
    [
        "You wake up.",
        "Everyone around\nyou is dead.",
        "Everyone you\never cared\nabout.",
        "Did yuo kill\nthem or were\nthey killed by\nyour dream?",
        "That you will\nnever know."
    ]
];


const isWhitespace = (c : string) : boolean => ["\n", " ", "\t"].includes(c);


export class StoryScreen implements Scene {


    private textIndex = 0;
    private charIndex = 0;
    private charTimer = 0;
    private ready : boolean = false;
    private rectTimer : number = 0;
    private maxLength = 0;
    private height = 0;
    private phase : 0 | 1 = 0;

    private isEnding = false;


    constructor() {}


    public init(param : SceneParam, event : CoreEvent) : void {

        this.textIndex = 0;
        this.charIndex = 0;
        this.charTimer = 0;

        this.ready = false;

        this.phase = Number(param) as (0 | 1);

        let arr = STORY[this.phase][0].split("\n");
        this.maxLength = Math.max(...arr.map(s => s.length));
        this.height = arr.length;
    }


    public update(event : CoreEvent) : void {

        const RECT_SPEED = 0.15;
        const CHAR_TIME = 4;

        let arr : string[];

        if (event.transition.isActive() || this.isEnding) return;

        this.rectTimer = (this.rectTimer + RECT_SPEED*event.step) % (Math.PI*2);

        this.ready = this.charIndex >= STORY[this.phase][this.textIndex].length;
        if (!this.ready) {

            if (event.input.anyPressed()) {

                this.charIndex = STORY[this.phase][this.textIndex].length;
                this.ready = true;
            }
            else if ((this.charTimer += event.step) >= CHAR_TIME ||
                isWhitespace(STORY[this.phase][this.textIndex]) ) {

                ++ this.charIndex;
                this.charTimer = 0;
            }
        }
        else {

            if (event.input.anyPressed()) {

                if (++ this.textIndex == STORY[this.phase].length) {

                    if (this.phase == 0) {

                        event.changeScene("game", 1);
                        event.transition.activate(false, TransitionType.Circle, 1.0/30.0, () => {});
                    }
                    else {

                        this.isEnding = true;
                        event.transition.activate(false, TransitionType.Fade, 1.0/120.0, () => {});
                    }
                }
                else {

                    this.charIndex = 0;
                    this.charTimer = 0;

                    arr = STORY[this.phase][this.textIndex].split("\n");
                    this.maxLength = Math.max(...arr.map(s => s.length));
                    this.height = arr.length;

                    this.ready = false;
                }
                event.audio.playSample(event.assets.getSample("choose"), 0.60);
            }
        }
    }


    public redraw(canvas : Canvas) : void {
     
        const XOFF = -24;
        const YOFF = 2;
        const BASE_SCALE = 0.75;

        let font = canvas.getBitmap("font");

        canvas.clear(0);

        if (this.isEnding) {

            canvas.drawText(font, "The End", 
                canvas.width/2, canvas.height/2-32, 
                XOFF, 0, TextAlign.Center);
            return;
        }

        let dx = canvas.width/2 - (this.maxLength * (64 + XOFF) * BASE_SCALE) / 2;
        let dy = canvas.height/2 - this.height * (64 + YOFF) * BASE_SCALE / 2;

        if ((this.textIndex > 0 || this.charIndex > 0) &&
            this.textIndex < STORY[this.phase].length) {

            canvas.drawText(font, 
                STORY[this.phase][this.textIndex].substring(0, this.charIndex),
                dx, dy, XOFF, YOFF, TextAlign.Left, BASE_SCALE, BASE_SCALE);
        }

        let rectY = Math.round(Math.sin(this.rectTimer) * 10);
        if (this.ready) {

            canvas.fillRect(
                canvas.width/2 + this.maxLength * (64 + XOFF) * BASE_SCALE / 2 + 30, 
                dy + this.height * (64 + YOFF) * BASE_SCALE + 20 + rectY, 
                30, 30);
        }
        canvas.setColor();
    }
}