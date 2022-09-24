import { Canvas } from "../renderer/canvas.js";
import { CoreEvent } from "../core/event.js";
import { Vector2 } from "../common/vector.js";
import { Particle } from "./particle.js";
import { Bitmap } from "../renderer/bitmap.js";


class Snowflake extends Particle {


    private size : number;

    private speedFactor : Vector2;
    private speedAngle : number;


    constructor(x : number, y : number, size : number) {

        super();

        const MIN_SPEED_X = 0.20*2;
        const MAX_SPEED_X = 1.25*2;
        const MIN_SPEED_Y = 0.20*2;
        const MAX_SPEED_Y = 1.5*2;

        this.pos.x = x;
        this.pos.y = y;

        this.friction.x = 0.1;
        this.friction.y = 0.1;

        this.speedFactor = new Vector2(
            MIN_SPEED_X + Math.random() * (MAX_SPEED_X - MIN_SPEED_X),
            MIN_SPEED_Y + Math.random() * (MAX_SPEED_Y - MIN_SPEED_Y));

        this.speedFactor.x *= (size/8);
        this.speedFactor.y *= (size/8);

        this.loop = true;
        this.exist = true;

        this.size = size;

        this.speedAngle = Math.random() * Math.PI * 2;

        this.radius = size;
    }


    protected updateLogic(event: CoreEvent) : void {
        
        const ANGLE_SPEED = 0.05;

        this.speedAngle = (this.speedAngle + ANGLE_SPEED * event.step) % (Math.PI*4);
        
        this.target.x = Math.sin(this.speedAngle * 0.5) * this.speedFactor.x;
        this.target.y = this.speedFactor.y * 0.5 * ((Math.sin(this.speedAngle) + 1.0));
    }


    private drawBase(canvas : Canvas, bmp : Bitmap | undefined, dx : number = 0, dy : number = 0) {

        let px = Math.round(this.pos.x - this.size/2) + dx;
        let py = Math.round(this.pos.y - this.size/2) + dy;

        canvas.drawScaledBitmap(bmp, px, py, this.size, this.size)
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) {

        this.drawBase(canvas, bmp);

        if (this.pos.x < 0)
            this.drawBase(canvas, bmp, canvas.width);
        else if (this.pos.x >= canvas.width)
            this.drawBase(canvas, bmp, -canvas.width);
        
        if (this.pos.y < 0)
            this.drawBase(canvas, bmp, 0, canvas.height);
        else if (this.pos.y >= canvas.height)
            this.drawBase(canvas, bmp, 0, -canvas.height);
    }
}   


export class Snowfall  {


    private snowflakes : Array<Snowflake>;


    constructor() {

        this.snowflakes = new Array<Snowflake> ();
        this.shuffle();
    }


    public shuffle() : void {

        const GRID_WIDTH = 160;
        const GRID_HEIGHT = 120;
        const MIN_SIZE = 4;
        const MAX_SIZE = 16;

        let dx : number;
        let dy : number;

        this.snowflakes = new Array<Snowflake> ();

        for (let y = 0; y < 800.0 / GRID_HEIGHT; ++ y) {

            for (let x = 0; x < 720.0 / GRID_WIDTH; ++ x) {

                dx = x * GRID_WIDTH + (Math.random()*2 - 1) * GRID_WIDTH/2;
                dy = y * GRID_HEIGHT + (Math.random()*2 - 1) * GRID_WIDTH/2;

                this.snowflakes.push(
                    new Snowflake(dx, dy, MIN_SIZE  + Math.random() * (MAX_SIZE-MIN_SIZE))
                );
            }
        }
    } 


    public update(event : CoreEvent) : void {

        for (let s of this.snowflakes) {

            s.update(event);
        }
    }


    public draw(canvas : Canvas) : void {

        let bmp = canvas.getBitmap("snowflake");

        canvas.setColor(255, 255, 255, 0.50);
        for (let s of this.snowflakes) {

            s.draw(canvas, bmp);
        }
        canvas.setColor();
    }
}
