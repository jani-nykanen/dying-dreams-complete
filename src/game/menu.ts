import { Canvas } from "../renderer/canvas.js";
import { Bitmap } from "../renderer/bitmap.js";
import { CoreEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { negMod } from "../common/math.js";


export class MenuButton {


    private text : string;
    private callback : (event : CoreEvent) => void;


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
    }


    public draw(canvas : Canvas, x = 0, y = 0, box = true) {

        const BOX_OFFSET = 4;
        const XOFF = -24;
        const YOFF = 56;

        if (!this.active) return;

        let font = canvas.getBitmap("font");

        let w = this.maxLength * (64 + XOFF);
        let h = this.buttons.length * YOFF;

        let dx = x + canvas.width/2 - w/2;
        let dy = y + canvas.height/2 - h/2; 

        if (box) {

            canvas.setColor(0, 0, 0, 0.67)
                  .fillRect(dx - BOX_OFFSET, dy - BOX_OFFSET,
                        w + BOX_OFFSET*2, h + BOX_OFFSET*2);
        }

        
        canvas.setColor();
        for (let i = 0; i < this.buttons.length; ++ i) {

            if (i == this.cursorPos) {

                canvas.setColor(255, 255, 85);
            }
            else {

                canvas.setColor();
            }

            canvas.drawText(font, this.buttons[i].getText(),
                dx, dy + i * YOFF, XOFF, 0);
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
