import { Vector2 } from "../common/vector.js";
import { GamePad } from "./gamepad.js";
import { InputState } from "./inputstate";
import { Keyboard } from "./keyboard.js";


const INPUT_DIRECTION_DEADZONE = 0.25;


class Action {


    public readonly key1 : string;
    public readonly key2 : string | null;
    public readonly button1 : number | null;
    public readonly button2 : number | null;


    constructor(key1 : string, key2 : string | null = null, 
        button1 : number | null = null, button2 : number | null = null) {

        this.key1 = key1;
        this.key2 = key2;
        this.button1 = button1;
        this.button2 = button2;
    }
}


export class Input {    


    private stick : Vector2; // "Simulates" analogue stick
    private oldStick : Vector2;
    private stickDelta : Vector2;

    private actions : Map<string, Action>;
    
    public readonly keyboard : Keyboard;
    public readonly gamepad : GamePad;


    constructor() {

        this.actions = new Map<string, Action> ();

        this.keyboard = new Keyboard();
        this.gamepad = new GamePad();

        window.addEventListener("contextmenu", (e : MouseEvent) => e.preventDefault());
        // In the case of iframe
        window.addEventListener("mousemove",   (_ : MouseEvent) => window.focus());
        window.addEventListener("mousedown",   (_ : MouseEvent) => window.focus());

        this.stick = new Vector2();
        this.oldStick = this.stick.clone();
        this.stickDelta = new Vector2();
    }


    public updateStick() : void {

        const EPS = 0.01;

        this.oldStick = this.stick.clone();
        this.stick.zeros();

        if ((this.keyboard.getState("ArrowLeft") & InputState.DownOrPressed) == 1) {

            this.stick.x = -1;
        }
        else if ((this.keyboard.getState("ArrowRight") & InputState.DownOrPressed) == 1) {

            this.stick.x = 1;
        }
        if ((this.keyboard.getState("ArrowUp") & InputState.DownOrPressed) == 1) {

            this.stick.y = -1;
        }
        else if ((this.keyboard.getState("ArrowDown") & InputState.DownOrPressed) == 1) {

            this.stick.y = 1;
        }

        if (this.stick.length() < EPS) {

            this.stick = this.gamepad.getStick();
        }

        this.stickDelta = new Vector2(
            this.stick.x - this.oldStick.x,
            this.stick.y - this.oldStick.y);
    }


    public update() : void {

        this.keyboard.update();
        this.gamepad.update();
    }


    public addAction(name : string,
        key1 : string, key2 : string | null = null, 
        button1 : number | null = null, button2 : number | null = null) : Input {

        this.actions.set(name, new Action(key1, key2, button1, button2));

        this.keyboard.preventKey(key1);
        if (key2 != null) {

            this.keyboard.preventKey(key2);
        }
        return this;
    }


    public getAction(name : string) : InputState {

        let state : InputState;
        let action = this.actions.get(name);
        if (action == undefined)
            return InputState.Up;

        state = this.keyboard.getState(action.key1);
        if (state == InputState.Up) {

            if (action.key2 != null) {

                state = this.keyboard.getState(action.key2);
                if (state != InputState.Up)
                    return state;
            }

            if (action.button1 != null) {

                state = this.gamepad.getButtonState(action.button1);
                if (state != InputState.Up)
                    return state;
            }

            if (action.button2 != null) {

                state = this.gamepad.getButtonState(action.button2);
                if (state != InputState.Up)
                    return state;
            }
        }
        return state;
    }


    public getStick = () : Vector2 => this.stick.clone();


    public upPress() : boolean {

        return this.stick.y < 0 && 
            this.oldStick.y >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y < -INPUT_DIRECTION_DEADZONE;
    }


    public downPress() : boolean {

        return this.stick.y > 0 && 
            this.oldStick.y <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.y > INPUT_DIRECTION_DEADZONE;
    }


    public leftPress() : boolean {

        return this.stick.x < 0 && 
            this.oldStick.x >= -INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x < -INPUT_DIRECTION_DEADZONE;
    }

    
    public rightPress() : boolean {

        return this.stick.x > 0 && 
            this.oldStick.x <= INPUT_DIRECTION_DEADZONE &&
            this.stickDelta.x > INPUT_DIRECTION_DEADZONE;
    }


    public anyPressed = () : boolean => this.keyboard.isAnyPressed() || this.gamepad.isAnyPressed();
}
