import { Canvas, TextAlign } from "../renderer/canvas.js";
import { CoreEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { negMod } from "../common/math.js";


const BUTTON_SCALE = 1.2;
const SCALE_SPEED = (BUTTON_SCALE-1.0) / 10.0;


export class MenuButton {


    private text : string;
    private callback : (event : CoreEvent) => void;

    private scale : number = 1.0;
    private scaleTarget : number = 1.0;


    constructor(text : string, callback : (event : CoreEvent) => void) {

        this.text = text;
        this.callback = callback;
    }


    public getText = () : string => this.text;
    public evaluateCallback = (event : CoreEvent) => this.callback(event);


    public clone() : MenuButton {

        return new MenuButton(this.text, this.callback);
    }


    public changeText(newText : string) {

        this.text = newText;
    }


    public update(event : CoreEvent) : void {

        if (this.scaleTarget > this.scale)
            this.scale = Math.min(this.scaleTarget, this.scale + SCALE_SPEED*event.step);
        else if (this.scaleTarget < this.scale)
            this.scale = Math.max(this.scaleTarget, this.scale - SCALE_SPEED*event.step);
    }


    public setScaleTarget(value : number) : void {

        this.scaleTarget = value;
    }


    public getScaleValue = () : number => this.scale;
}


export class Menu {


    private buttons : Array<MenuButton>;

    private cursorPos : number = 0;
    private active : boolean = false;
    
    private maxLength : number;


    constructor(buttons : Array<MenuButton>, makeActive = false) {

        this.buttons = buttons.map((_, i) => buttons[i].clone());
        this.maxLength = Math.max(...this.buttons.map(b => b.getText().length));

        this.active = makeActive;
    }


    public activate(cursorPos = this.cursorPos) : void {

        this.cursorPos = cursorPos % this.buttons.length;
        this.active = true;
    }


    public update(event : CoreEvent) : void {

        if (!this.active) return;

        let oldPos = this.cursorPos;

        if (event.input.upPress()) {

            -- this.cursorPos;
        }
        else if (event.input.downPress()) {

            ++ this.cursorPos;
        }

        if (oldPos != this.cursorPos) {

            this.cursorPos = negMod(this.cursorPos, this.buttons.length);
            
            event.audio.playSample(event.assets.getSample("choose"), 0.60);
        }

        let activeButton = this.buttons[this.cursorPos];
        
        if (activeButton != null && (
            event.input.getAction("select") == InputState.Pressed ||
            event.input.getAction("start") == InputState.Pressed)) {

            activeButton.evaluateCallback(event);
            
            event.audio.playSample(event.assets.getSample("select"), 0.60);
        }

        for (let i = 0; i < this.buttons.length; ++ i) {

            this.buttons[i].setScaleTarget(i == this.cursorPos ? BUTTON_SCALE : 1.0);
            this.buttons[i].update(event);
        }
    }


    public draw(canvas : Canvas, x = 0, y = 0, box = true) {

        const BOX_OFFSET_X = 12;
        const BOX_OFFSET_Y = 16;
        const XOFF = -24;
        const YOFF = 56;
        const BASE_SCALE = 0.80;

        if (!this.active) return;

        let font = canvas.getBitmap("font");

        let w = this.maxLength * (64 + XOFF);
        let h = this.buttons.length * YOFF;

        let dx = x + canvas.width/2 - w/2;
        let dy = y + canvas.height/2 - h/2; 

        if (box) {

            canvas.setColor(0, 0, 0, 0.67)
                  .fillRect(dx - BOX_OFFSET_X, dy - BOX_OFFSET_Y,
                        w + BOX_OFFSET_X*2, h + BOX_OFFSET_Y*2);
        }

        
        let scale = 1.0;

        canvas.setColor();
        for (let i = 0; i < this.buttons.length; ++ i) {

            if (i == this.cursorPos) {

                canvas.setColor(255, 255, 85);
            }
            else {

                canvas.setColor();
            }

            scale = this.buttons[i].getScaleValue();

            canvas.drawText(font, this.buttons[i].getText(),
                canvas.width/2, dy + i * YOFF, 
                XOFF, 0, TextAlign.Center, 
                BASE_SCALE * scale, BASE_SCALE * scale);
        } 
    }


    public isActive = () : boolean => this.active;


    public deactivate() : void {

        this.active = false;
    }


    public changeButtonText(index : number, text : string) : void {

        this.buttons[index].changeText(text);
    }
}
