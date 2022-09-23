import { Canvas, TextAlign } from "../renderer/canvas.js";
import { Scene, SceneParam } from "../core/scene.js";
import { TransitionType } from "../core/transition.js";
import { CoreEvent } from "../core/event.js";



export class StartIntro implements Scene {


    private phase = 0;
    private timer = 0;


    public init(param: SceneParam, event: CoreEvent): void { 

        event.transition.activate(false, TransitionType.Fade, 1.0/30.0, () => {}, 6);
    }


    public update(event: CoreEvent): void {

        const PHASE_TIME = 60;

        if (event.transition.isActive())
            return;


        if ((this.timer += event.step) >= PHASE_TIME ||
            event.input.anyPressed()) {

            this.timer = 0;

            event.transition.activate(true, TransitionType.Fade, 1.0/30.0, 
                (event : CoreEvent) => {

                    if (this.phase == 1) {

                        event.changeScene("titlescreen", 0);
                        event.transition.activate(false, TransitionType.Circle, 1.0/30.0, () => {});
                    } 
                    else {

                        ++ this.phase;
                    }
                }, 6);
        }
    }


    public redraw(canvas: Canvas) : void {
        
        let font = canvas.getBitmap("font");

        canvas.clear(0);

        if (this.phase == 0) {

            canvas.drawText(font, "A GAME BY", 
                canvas.width/2, 
                canvas.height/2 -10, 
                0, 0, TextAlign.Center);
            canvas.drawText(font, "JANI NYK@NEN", 
                canvas.width/2, 
                canvas.height/2 + 2, 
                0, 0, TextAlign.Center)
        }
        else {

            canvas.drawText(font, "MADE FOR JS13K", 
                canvas.width/2, 
                canvas.height/2 - 4, 
                0, 0, TextAlign.Center);
        }
    }
}
