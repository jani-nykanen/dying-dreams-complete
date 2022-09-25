import { Canvas } from "../renderer/canvas.js";
import { Bitmap } from "../renderer/bitmap";
import { CoreEvent } from "../core/event.js";
import { Vector2 } from "../common/vector.js";
import { RGBA } from "../common/rgba.js";



const updateSpeedComponent = (speed : number, target : number, step : number) : number => {

    if (speed < target) {

        return Math.min(target, speed + step);
    }
    return Math.max(target, speed - step);
}


export class Particle {

    
    protected pos : Vector2;
    protected speed : Vector2;
    protected target : Vector2;
    protected friction : Vector2;

    protected radius = 8;

    protected exist = false;
    protected loop = false;


    constructor() {

        this.pos = new Vector2();
        this.speed = new Vector2();
        this.target = new Vector2();
        this.friction = new Vector2(1, 1);
    }


    protected updateLogic(event : CoreEvent) : void {}


    public update(event : CoreEvent) : void {

        if (!this.exist)
            return;

        this.speed.x = updateSpeedComponent(this.speed.x, this.target.x, this.friction.x*event.step);
        this.speed.y = updateSpeedComponent(this.speed.y, this.target.y, this.friction.y*event.step);

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;

        this.updateLogic(event);

        if (this.loop) {

            if (this.pos.y - this.radius >= event.screenHeight) {

                this.pos.y -= event.screenHeight;
            }
        }
        else {

            if (this.pos.x + this.radius < 0 ||
                this.pos.x - this.radius >= event.screenWidth ||
                this.pos.y + this.radius < 0 ||
                this.pos.y - this.radius >= event.screenHeight) {

                this.exist = false;
            }
        }
    }


    public spawnBase(x : number, y : number, sx : number, sy : number) : void {

        const GRAVITY = 20.0;

        this.pos = new Vector2(x, y);
        this.speed = new Vector2(sx, sy);
        this.target.x = this.speed.x;
        this.target.y = GRAVITY;

        this.exist = true;
    }


    public draw(canvas : Canvas, bmp? : Bitmap) : void {}


    public doesExist = () : boolean => this.exist;

    public kill() : void {

        this.exist = false;
    }
}



export class StarParticle extends Particle {


    private waveTimer = 0.0;
    private index : number = 0;


    constructor() {

        super();

        this.friction.x = 0;
        this.friction.y = 0.50;
        this.radius = 16;
    }


    protected updateLogic(event: CoreEvent) : void {

        const WAVE_SPEED = Math.PI*2 / 30;

        this.waveTimer = (this.waveTimer + WAVE_SPEED*event.step) % (Math.PI*2);
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) : void {

        if (!this.exist)
            return;

        let px = Math.round(this.pos.x);
        let py = Math.round(this.pos.y);

        canvas.transform.push()
              .translate(px, py)
              .rotate(Math.atan2(this.speed.y, this.speed.x) + Math.PI/2)
              .use();

        canvas.drawBitmapRegion(bmp, this.index*64, 0, 64, 64, -32, -32);

        canvas.transform.pop().use();
    }


    public spawn(x : number, y : number, sx : number, sy : number, index : number) {

        this.spawnBase(x, y, sx, sy);
        this.index = index;
    }
}


export class RubbleParticle extends Particle {


    private tileIndex : number = 0;


    constructor() {

        super();

        this.friction.x = 0;
        this.friction.y = 0.50;
        this.radius = 40;
    }


    public draw(canvas : Canvas, bmp : Bitmap) {

        if (!this.exist)
            return;

        let px = Math.round(this.pos.x);
        let py = Math.round(this.pos.y);

        let srcx = 80 + (this.tileIndex % 2) * 40;
        let srcy = 80 + Math.floor(this.tileIndex/2) * 40;

        canvas.drawBitmapRegion(bmp, 
            srcx, srcy, 40, 40,
            px-20, py-20);
    }


    public spawn(x : number, y : number, sx : number, sy : number, tileIndex : number) {

        this.spawnBase(x, y, sx, sy);
        this.tileIndex = tileIndex;
    }
}


export class Bat extends Particle {


    private frameTimer = 0;
    private frame = 0;


    constructor() {

        super();

        this.friction.x = 0.25;
        this.friction.y = 0.50;
        this.radius = 40;
    }


    protected updateLogic(event: CoreEvent) : void {

        const ANIM_SPEED = 6;

        if ((this.frameTimer += event.step) >= ANIM_SPEED) {

            this.frameTimer %= ANIM_SPEED;
            this.frame = (this.frame + 1) % 2;
        }
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined) {

        if (!this.exist)
            return;

        let px = Math.round(this.pos.x);
        let py = Math.round(this.pos.y);

        canvas.transform.push()
              .translate(px, py)
              .rotate(Math.atan2(this.target.y, this.speed.x) + Math.PI/2)
              .use();

        canvas.drawBitmapRegion(bmp, 
            0, this.frame*48, 96, 48,
            -48, -24);

        canvas.transform.pop().use();
    }


    public spawn(x : number, y : number, sx : number, sy : number) {

        this.spawnBase(x, y, sx, sy);
        this.speed.x = 0.0;

        this.target.y *= -1;
    }
}



export const nextParticle = (arr : Array<Particle>, type : Function) : Particle => {

    let p : Particle | null = null;
    for (let a of arr) {

        if (!a.doesExist()) {

            p = a;
            break;
        }
    }

    if (p == null) {

        p = new type.prototype.constructor();
        arr.push(p as Particle);
    }
    return p as Particle; // p is non-null at this point
}
