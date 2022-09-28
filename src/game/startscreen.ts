import { CoreEvent } from "../core/event.js";
import { Scene, SceneParam } from "../core/scene.js";
import { Canvas, TextAlign } from "../renderer/canvas.js";
import { Menu, MenuButton } from "./menu.js";


const TEXT = `Would you like to\nenable audio? You\ncan change this\nlater. Press enter\nto confirm.`;


export class StartScreen implements Scene {


    private menu : Menu;


    constructor() {

        this.menu = new Menu(
            [
                new MenuButton("Yes", (event : CoreEvent) => {

                    event.audio.toggle(true);
                    this.goToStartIntro(event);
                }),

                new MenuButton("No", (event : CoreEvent) => {

                    event.audio.toggle(false);
                    this.goToStartIntro(event);
                })
            ], true);
    } 


    private goToStartIntro(event : CoreEvent) : void {

        event.changeScene("titlescreen");
    }


    public init(param : SceneParam, event: CoreEvent): void { }


    public update(event : CoreEvent): void {

        this.menu.update(event);
    }


    public redraw(canvas : Canvas) : void {
        
        // TODO: Rewrite...

        const XOFF = -24;
        const YOFF = -8;
        const BOX_HEIGHT_1 = 256;
        const BOX_WIDTH_1 = 600;
        const BOX_OFF_1 = 200;
        const BOX_HEIGHT_2 = 128;
        const BOX_WIDTH_2 = 160;
        const BOX_OFF_2 = 512;
        const SHADOW_OFF = 16;

        canvas.clear(85, 170, 255);

        let font = canvas.getBitmap("font");

        let dx1 = canvas.width/2 - BOX_WIDTH_1/2;

        canvas.setColor(0, 0, 85)
            .fillRect(dx1 + SHADOW_OFF, BOX_OFF_1+SHADOW_OFF, BOX_WIDTH_1, BOX_HEIGHT_1)
            .fillRect(canvas.width/2-BOX_WIDTH_2/2 + SHADOW_OFF, BOX_OFF_2 + SHADOW_OFF, BOX_WIDTH_2, BOX_HEIGHT_2)
            .setColor(0, 85, 170)
            .fillRect(dx1, BOX_OFF_1, BOX_WIDTH_1, BOX_HEIGHT_1)
            .fillRect(canvas.width/2-BOX_WIDTH_2/2, BOX_OFF_2, BOX_WIDTH_2, BOX_HEIGHT_2)
            .setColor()
            .drawText(font, TEXT, 128, BOX_OFF_1+24, XOFF, YOFF, TextAlign.Left, 0.75, 0.75);
        
        let menuOff = BOX_OFF_2 - canvas.height/2 + 64;
        this.menu.draw(canvas, 0, menuOff, false);

        let bmpNote = canvas.getBitmap("audioStart");
        if (bmpNote == undefined)
            return;

        canvas.drawBitmap(bmpNote, canvas.width/2 - bmpNote.width/2, 16);
    }
}
