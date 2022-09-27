import { Vector2 } from "../common/vector.js";
import { CoreEvent } from "../core/event.js";
import { Canvas, Flip } from "../renderer/canvas.js";
import { nextParticle, StarParticle } from "./particle.js";


const PARTICLE_TIME = 5;
const SHRINK_TIME = 210;
const FALL_START_SPEED = 4.0;


export class Bed {


    private pos : Vector2;
    private speed : Vector2;

    private phase : number = 0;

    private active : boolean = false;
    private dead : boolean = false;

    private particleTimer : number = 0.0;
    private shrinkTimer : number = 0.0;
    
    private readonly particles : Array<StarParticle>;


    constructor(particles : Array<StarParticle>) {

        this.pos = new Vector2();
        this.speed = new Vector2();

        this.particles = particles;
    }


    private spawnParticle() : void {

        const SPEED_Y_MAX = 16.0;
        const SPEED_X_RANGE = 10.0;

        let speedx = -SPEED_X_RANGE + Math.random() * SPEED_X_RANGE * 2;
        let speedy = this.speed.y + (Math.random() * (SPEED_Y_MAX - this.speed.y));
        
        (nextParticle(this.particles, StarParticle) as StarParticle)
            .spawn(this.pos.x, this.pos.y, speedx, speedy, (Math.random()*3) | 0);
    }


    private spawnTinyStars(x : number, y : number, count : number, 
        angleStart : number) : void {

        const BASE_SPEED = 10.0;
        const VERTICAL_JUMP = -5.0;

        let angle : number;

        for (let i = 0; i < count; ++ i) {

            angle = angleStart + Math.PI*2 / count * i;

            (nextParticle(this.particles, StarParticle) as StarParticle)
                .spawn(x, y, 
                    Math.cos(angle) * BASE_SPEED, 
                    Math.sin(angle) * BASE_SPEED + VERTICAL_JUMP, 3);
        }   
    }


    private updatePhase1(event : CoreEvent) : void {

        const TARGET_SPEED_Y = -80.0;
        const FRICTION = 0.02;
        const PARTICLE_SPAWN_MAX = 3;
        const FALL_JUMP = -40.0;

        this.speed.y = Math.max(TARGET_SPEED_Y, 
            this.speed.y - FRICTION * event.step);

        this.particleTimer += event.step;

        let pcount : number;
        if (this.particleTimer >= PARTICLE_TIME) {

            pcount = (Math.random() * PARTICLE_SPAWN_MAX) + 1;
            for (let i = 0; i < pcount; ++ i) {

                this.spawnParticle();
            }
            this.particleTimer %= PARTICLE_TIME;
        }

        if (this.pos.y < 0) {

            ++ this.phase;
            this.speed.y = FALL_START_SPEED;
            this.pos.y += FALL_JUMP;
        }
    }


    private updatePhase2(event : CoreEvent) : void {

        this.shrinkTimer += event.step;
        if (this.shrinkTimer >= SHRINK_TIME) {

            this.spawnTinyStars(this.pos.x, this.pos.y - 120, 4, Math.PI/4);
            this.dead = true;

            event.audio.playSample(event.assets.getSample("puff"), 0.50);

            return;
        }

        let t = 1.0 - this.shrinkTimer / SHRINK_TIME;
        this.speed.y = FALL_START_SPEED * t;
    }


    public spawn(x : number, y : number, event : CoreEvent) : void {

        this.pos = new Vector2(x, y);
        this.speed.zeros();

        this.particleTimer = 0;
        this.shrinkTimer = 0.0;

        this.phase = 0;

        this.active = true;
        this.dead = false;

        event.audio.playSample(event.assets.getSample("boost"), 0.50);
    }


    public update(event : CoreEvent) : void {

        if (!this.active || this.dead) 
            return;

        if (this.phase == 0) {

            this.updatePhase1(event);
        }
        else {

            this.updatePhase2(event);
        }
        this.pos.y += this.speed.y;
    }   


    public draw(canvas : Canvas) : void {

        const SHAKE = 4;
        const ROTATE_COUNT = 8;
        const FALL_SCALE = 0.40;

        if (!this.active || this.dead)
            return;

        let bmp = canvas.getBitmap("bed");
        if (bmp == undefined)
            return;

        let shakex = 0.0;
        let shakey = 0.0;
        let scale = 1.0;
        let flip = Flip.None;
        let angle = 0.0;
        let t : number;

        if (this.phase == 0) {

            shakex = SHAKE * (Math.random() * 2 - 1.0);
            shakey = SHAKE * (Math.random() * 2 - 1.0);
        }
        else {

            t = (1.0 - this.shrinkTimer / SHRINK_TIME);
            scale = FALL_SCALE * t;
            flip = Flip.Vertical;
            angle = ROTATE_COUNT * Math.PI*2 * t;
        }

        canvas.transform.push()
            .translate(this.pos.x + shakex, this.pos.y - bmp.height/2 + shakey)
            .rotate(angle)
            .scale(scale, scale)
            .use();

        canvas.drawBitmap(bmp, 
            -bmp.width/2, 
            -bmp.height/2,
            flip);

        canvas.transform.pop().use();
    }


    public isActive = () : boolean => this.active;
    public isDead = () : boolean => this.dead;
    public isFalling = () : boolean => this.phase == 1;
}
