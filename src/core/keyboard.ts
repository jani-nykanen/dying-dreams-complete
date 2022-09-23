import { InputState } from "./inputstate.js";


export class Keyboard {


    private states : Map<string, InputState>;
    private prevent : Array<string>;
    private actions : Map<string, [string, string | undefined]>;

    private anyPressed : boolean = false;


    constructor() {

        this.states = new Map<string, InputState> ();
        this.prevent = new Array<string> ();
        this.actions = new Map<string, [string, string | undefined]> ();

        window.addEventListener("keydown", (e : any) => {

            this.keyEvent(true, e.code);
            if (this.prevent.includes(e.code))
                e.preventDefault();
            
        });
        window.addEventListener("keyup", (e : any) => {

            this.keyEvent(false, e.code);
            if (this.prevent.includes(e.code))
                e.preventDefault();
        });  
    }


    public keyEvent(down : boolean, key : string) : void {

        if (down) {

            if (this.states.get(key) === InputState.Down)
                return;
            this.states.set(key, InputState.Pressed);
            this.anyPressed = true;
            return;
        }

        if (this.states.get(key) === InputState.Up)
            return;
        this.states.set(key, InputState.Released);
    }


    public update() : void {

        for (let k of this.states.keys()) {

            if (this.states.get(k) === InputState.Pressed)
                this.states.set(k, InputState.Down);
            else if (this.states.get(k) === InputState.Released)
                this.states.set(k, InputState.Up);
        }

        this.anyPressed = false;
    }


    public addAction(name : string, key1 : string, key2 : string | undefined = undefined) : Keyboard {

        this.actions.set(name, [key1, key2]);
        this.prevent.push(key1);
        if (key2 !== undefined) 
            this.prevent.push(key2);

        return this;
    }


    public getState(name : string) : InputState {

        let state = this.states.get(name);
        if (state == undefined)
            return InputState.Up;

        return state;
    }


    public getActionState(name : string) : InputState {

        let a = this.actions.get(name);
        if (a === undefined)
            return InputState.Up;

        let state = this.getState(a[0]);
        if (state == InputState.Up && a[1] !== undefined) {

            return this.getState(a[1]);
        }
        return state;
    }


    public isAnyPressed = () : boolean => this.anyPressed;


    public preventKey(key : string) : void {

        this.prevent.push(key);
    } 
    
}
