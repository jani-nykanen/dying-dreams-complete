import { Assets } from "../io/assets.js";
import { Canvas, Flip, TextAlign } from "../renderer/canvas.js";
import { Bitmap } from "../renderer/bitmap.js";
import { CoreEvent } from "../core/event.js";
import { InputState } from "../core/inputstate.js";
import { Bat, nextParticle, RubbleParticle, StarParticle, VanishingLock } from "./particle.js";
import { Direction, PuzzleState } from "./puzzlestate.js";
import { Snowfall } from "./snowfall.js";
import { COLUMN_COUNT, createTerrainMap } from "./terrainmap.js";


const SOLID_TILES = [1, 3, 8, 9, 13, 14];
const DYNAMIC_TILES = [4, 10];
const STATE_BUFFER_MAX = 64;
const CLEAR_WAIT_TIME = 120;
const START_TIME = 30;

const TILE_WIDTH = 80;
const TILE_HEIGHT = 80;


export class Stage {


    private baseTilemap : Array<number>;
    private terrainMap : Array<number>;

    private states : Array<PuzzleState>;
    private activeState : PuzzleState;
    private oldState : PuzzleState;
    private moveData : Array<Direction>;

    private moveTimer = 0.0;
    private moving = false;
    private falling = false;
    private climbing = false;
    private rubbleSpawned = false;
    private boulderMoved = false;
    private boulderFalling = false;

    private staticAnimationTimer = 0.0;

    private stars : Array<StarParticle>;
    private rubble : Array<RubbleParticle>;
    private bats : Array<Bat>;
    private locks : Array<VanishingLock>;

    private snowfall : Snowfall;

    private stageIndex : number;
    private startTimer : number = START_TIME;

    private cleared : boolean = false;
    private clearTimer = 0.0;

    public readonly width = 10;
    public readonly height = 9;


    constructor(index : number, event : CoreEvent) {

        let map = event.assets.getTilemap(String(index));
        if (map == undefined) {

            throw "No level data for map index " + String(index);
        }
        this.baseTilemap = Array.from(map.cloneLayer(1) as number[]);

        this.states = new Array<PuzzleState> ();
        this.activeState = new PuzzleState(
            this.baseTilemap,
            this.baseTilemap.map(v => Number(DYNAMIC_TILES.includes(v)) * v),
            this.width, this.height, Flip.None);
        this.states.push(this.activeState.clone());
        this.oldState = this.activeState.clone();

        this.moveData = (new Array<Direction> (this.width*this.height)).fill(Direction.None);

        this.terrainMap = createTerrainMap(this.baseTilemap, this.width, this.height);

        this.stageIndex = index;

        this.stars = new Array<StarParticle> ();
        this.rubble = new Array<RubbleParticle> ();
        this.bats = new Array<Bat> ();
        this.locks = new Array<VanishingLock> ();

        this.snowfall = new Snowfall();
    }


    private isReserved(x : number, y : number) : boolean {

        let bottom = this.activeState.getTile(0, x, y);
        let top = this.activeState.getTile(1, x, y);
        
        return SOLID_TILES.includes(bottom) ||
               top == 4 || top == 10;
    }


    private checkLadder(x : number, y : number, direction : Direction, falling = false) : boolean {

        // TODO: Simplify (make more "compact")

        if (direction == Direction.Left || direction == Direction.Right)
            return true;

        let tid = this.activeState.getTile(0, x, y);
        let ret = tid == 2;
        if (!ret) {

            if (direction == Direction.Down) {

                return this.activeState.getTile(0, x, y+1) == 2 ||
                    (!falling && y < this.height-1 && this.activeState.getTile(1, x, y+2) == 4);
            }
            else if (tid == 0) {

                for (let dy = y+1; dy < this.height; ++ dy) {

                    // Need to use the old state here...
                    // TODO: Does this cause problems?
                    if (this.oldState.getTile(1, x, dy) != 4)
                        break;
                    if (this.oldState.getTile(0, x, dy) == 2)
                        return true;
                }
            }
        }
        return ret;
    }


    private spawnRubble(x : number, y : number) : void {

        const INITIAL_SPEEDS = [0.5, 1.5, 2.5, 3.5];

        for (let dy = 0; dy < 2; ++ dy) {

            for (let dx = 0; dx < 2; ++ dx) {

                (nextParticle(this.rubble, RubbleParticle) as RubbleParticle)
                    .spawn(x + dx*(TILE_WIDTH/2) + TILE_WIDTH/4, 
                           y + dy*(TILE_HEIGHT/2) + TILE_HEIGHT/4,
                           0, INITIAL_SPEEDS[dy*2 + dx] * 5,
                           dy*2 + dx);
            }
        }
        this.rubbleSpawned = true;
    }


    private controlPlayer(x : number, y : number, dx : number, dy : number, 
        direction : Direction, fallCheck = false) : boolean {

        if (this.moveData[y*this.width + x] != Direction.None ||
            this.activeState.getTile(0, x, y) == 13 ||
            this.isReserved(x + dx, y + dy) ||
            this.checkLadder(x, y, direction, fallCheck) == fallCheck) {

            return false;
        }

        this.activeState.setTile(1, x, y, 0);
        this.activeState.setTile(1, x + dx, y + dy, 4);

        if (!fallCheck && y < this.height-1 && this.activeState.getTile(0, x, y+1) == 9) {

            this.activeState.setTile(0, x, y+1, 0);
            this.spawnRubble(x*TILE_WIDTH, (y+1)*TILE_HEIGHT);
        }

        this.moveData[(y + dy) * this.width + (x + dx)] = direction;

        if (direction == Direction.Left) {

            this.activeState.setFlip(Flip.Horizontal);
        }
        else if (direction == Direction.Right) {

            this.activeState.setFlip(Flip.None);
        }
        return true;
    }

    
    private controlBoulder(x : number, y : number, dx : number, dy : number, 
        direction : Direction, fallCheck = false) : boolean {

        if (!fallCheck && 
            (direction == Direction.Up || direction == Direction.Down)) {

            return false;
        }

        if (this.moveData[y*this.width + x] != Direction.None || 
            this.isReserved(x + dx, y + dy)) {

            return false;
        }

        let move = fallCheck;
        let near : number;

        if (!move) {

            // Check if a player in the correct direction
            for (let ty = y; ty < this.height; ++ ty) {

                near = this.oldState.getTile(1, x - dx, ty);

                if (this.oldState.getTile(1, x, ty) != 10 ||
                    (near != 4 && SOLID_TILES.includes(this.oldState.getTile(0, x + dx, ty))))
                    return false;

                if (near == 4) {

                    move = true;
                    break;
                }
            }
            if (!move)
                return false;
        }

        this.activeState.setTile(1, x, y, 0);
        this.activeState.setTile(1, x + dx, y + dy, 10);
        this.moveData[(y + dy) * this.width + (x + dx)] = direction;

        return true;
    }


    private handleAction(direction : Direction, event : CoreEvent, fallCheck = false) : boolean {

        const DX = [1, 0, -1, 0];
        const DY = [0, -1, 0, 1];

        if (direction == Direction.None)
            return false;

        let dx = DX[Number(direction) -1];
        let dy = DY[Number(direction) -1];

        let moved = false;
        let changed = false;

        if (!fallCheck) {

            this.oldState = this.activeState.clone();
        }

        do {

            changed = false;
            this.activeState.iterate(1, (x : number, y : number, v : number) => {

                switch (v) {

                // Player
                case 4:

                    if (this.controlPlayer(x, y, dx, dy, direction, fallCheck)) {

                        moved = true;
                        changed = true;
                    }
                    break;

                // Boulder
                case 10:

                    if (this.controlBoulder(x, y, dx, dy, direction, fallCheck)) {

                        moved = true;
                        changed = true;

                        this.boulderMoved = true;
                        if (fallCheck) {

                            this.boulderFalling = true;
                        }
                    }
                    break;

                default:
                    break;
                }

            });

        } while(changed);

        return moved;
    }


    private control(assets : Assets, event : CoreEvent) : void {

        const EPS = 0.25;

        if (this.moving)
            return;

        let dir = Direction.None;
        let stick = event.input.getStick();
        let horizontal = Math.abs(stick.x) > Math.abs(stick.y);

        if (horizontal && stick.x > EPS) {

            dir = Direction.Right;
        }
        else if (!horizontal && stick.y < -EPS) {

            dir = Direction.Up;
        }
        else if (horizontal && stick.x < -EPS) {

            dir = Direction.Left;
        }
        else if (!horizontal && stick.y > EPS) {

            dir = Direction.Down;
        }

        this.rubbleSpawned = false;
        this.boulderMoved = false;

        if (this.handleAction(dir, event)) {

            this.moving = true;
            this.moveTimer = 0.0;
            this.falling = false;

            if (dir == Direction.Up || dir == Direction.Down) {

                this.climbing = true;
            }

            if (this.rubbleSpawned) {

                event.audio.playSample(assets.getSample("rumble"), 0.40);
            }

            if (this.boulderMoved) {

                event.audio.playSample(assets.getSample("boulder"), 0.60);
            }
        }
    }


    private spawnParticles(x : number, y : number, count : number, 
        angleStart : number, index : number, spawnBat = false) : void {

        const BAT_SPEED_X_RANGE = 10.0;
        const BAT_SPEED_Y = 2.5;
        const BASE_SPEED = 10.0;
        const VERTICAL_JUMP = -5.0;

        let angle : number;

        for (let i = 0; i < count; ++ i) {

            angle = angleStart + Math.PI*2 / count * i;

            (nextParticle(this.stars, StarParticle) as StarParticle)
                .spawn(x, y, 
                    Math.cos(angle) * BASE_SPEED, 
                    Math.sin(angle) * BASE_SPEED + VERTICAL_JUMP,
                    index);
        }   

        if (spawnBat) {

            (nextParticle(this.bats, Bat) as Bat)
                .spawn(x, y, (Math.random() * 1.0 - 0.5) * BAT_SPEED_X_RANGE, BAT_SPEED_Y);
        }
    }


    private toggleBlocks() : void {

        let tid : number;
        for (let i = 0; i < this.width*this.height; ++ i) {

            tid = this.activeState.getIndexedTile(0, i);
            if (tid == 12 || tid == 13)
                this.activeState.setIndexedTile(0, i, tid == 12 ? 13 : 12);
        }
    }


    private countKeys() : void {

        const LOCK_SPEED = 15.0;

        let keyFound = false;
        this.activeState.iterate(0, (x : number, y : number, v : number) => {

            if (v == 15) {

                keyFound = true;
                return;
            }
        });
        if (keyFound)
            return;

        // Destroy keyholes
        this.activeState.iterate(0, (x : number, y : number, v : number) => {

            if (v == 14) {

                this.activeState.setTile(0, x, y, 0);
                (nextParticle(this.locks, VanishingLock) as VanishingLock)
                    .spawn((x + 0.5) * TILE_WIDTH, (y + 0.5) * TILE_HEIGHT, 1.0/LOCK_SPEED);
            }
        });
    }


    private checkStaticTileEvents(assets : Assets, event : CoreEvent) : boolean {

        const HURTING_TILES = [5, 6, 7];

        let somethingHappened = false;
        let hasUnpressedButtons = false;
        let hasButtons = false;

        let bottom : number;
        let top : number;

        let index : number;

        let keyCollected = false;

        this.cleared = true;

        this.activeState.iterate(0, (x : number, y : number, v : number) => {

            bottom = this.activeState.getTile(0, x, y);
            top = this.activeState.getTile(1, x, y);
            
            // Check buttons
            if (bottom == 11) {

                hasButtons = true;

                if (top == 0 && !hasUnpressedButtons)
                    hasUnpressedButtons = true;
            }

            // Key
            if (bottom == 15 && top == 4) {

                this.activeState.setTile(0, x, y, 0);
                event.audio.playSample(assets.getSample("key"), 0.60);

                keyCollected = true;

                this.spawnParticles((x + 0.5) * TILE_WIDTH, (y + 0.5) * TILE_HEIGHT, 4, Math.PI/4, 3);
            }

            // Kill players and/or boulders
            if ((top == 4 &&
                HURTING_TILES.includes(bottom)) ||
                (top == 10 && bottom == 5)) {

                index = 0;
                if (top != 10)
                    this.activeState.setTile(1, x, y, 0);
                
                if (bottom == 5) {

                    this.activeState.setTile(0, x, y, 0);
                    index = 1;
                }
                else if (bottom == 7) {

                    this.activeState.setTile(0, x, y, 8);
                    index = 2;
                }

                this.spawnParticles(
                    x*TILE_WIDTH + TILE_WIDTH/2, y*TILE_HEIGHT + TILE_HEIGHT/2, 
                    6, Math.PI/3, index, top == 4);

                event.audio.playSample(assets.getSample("die"), 0.60);

                somethingHappened = true;
            }
            else if (top == 4) {

                this.cleared = false;
            }
        });

        // Toggle buttons
        if (hasButtons &&
            this.activeState.getToggleableWallState() != hasUnpressedButtons) {

            this.toggleBlocks();
            this.activeState.setToggleableWallState(hasUnpressedButtons);

            event.audio.playSample(assets.getSample("toggle" + (hasUnpressedButtons ? "2" : "1")), 0.60);
        }

        if (this.cleared) {

            event.audio.pauseMusic();
            this.clearTimer = CLEAR_WAIT_TIME;
            event.audio.playSample(assets.getSample("victory"), 0.60);
        }

        if (keyCollected) {

            this.countKeys();
        }

        return somethingHappened;
    }


    private pushState() : void {
        
        this.states.push(this.oldState.clone());
        if (this.states.length >= STATE_BUFFER_MAX) {

            this.states.shift();
        }
    }


    private move(assets : Assets, event : CoreEvent) : void {

        const MOVE_SPEED_BASE = 1.0/16.0;
        const MOVE_SPEED_FALL = 1.0/8.0;

        if (!this.moving)
            return;

        let moveSpeed = this.falling ? MOVE_SPEED_FALL : MOVE_SPEED_BASE;

        let oldMoveTime = this.moveTimer;
        this.moveTimer += moveSpeed * event.step;

        if (this.climbing && 
            oldMoveTime <= 0.5 && this.moveTimer > 0.5) {
            
            event.audio.playSample(assets.getSample("climb"), 0.60);
        }

        if (this.moveTimer >= 1.0) {
            
            this.moveTimer = 0;
            this.moving = false;
            this.climbing = false;
            this.falling = false;
            this.moveData.fill(Direction.None);

            this.checkStaticTileEvents(assets, event);
            
            if (this.handleAction(Direction.Down, event, true)) {
                
                this.moving = true;
                this.moveTimer = 0.0;

                this.falling = true;
            }
            else {

                if (!this.falling && this.boulderFalling) {

                    event.audio.playSample(assets.getSample("boulder"), 0.60);
                    this.boulderFalling = false;
                }
                this.pushState();
            }
        }
    }


    private drawTerrain(canvas : Canvas, bmp : Bitmap | undefined) : void {

        let sx : number;
        let sy : number;
        let tid : number;

        for (let y = 0; y < this.height*2; ++ y) {

            for (let x = 0; x < this.width*2; ++ x) {

                tid = this.terrainMap[y * this.width * 2 + x];
                if (tid < 0)
                    continue;

                if (tid == 0) {

                    canvas.setColor(255, 170, 85)
                          .fillRect(x*(TILE_WIDTH/2), y*(TILE_HEIGHT/2), TILE_WIDTH/2, TILE_HEIGHT/2)
                          .setColor();
                }
                else {
                    
                    -- tid;

                    sx = tid % COLUMN_COUNT;
                    sy = (tid / COLUMN_COUNT) | 0;

                    canvas.drawBitmapRegion(bmp, 
                        sx*(TILE_WIDTH/2), sy*(TILE_HEIGHT/2), 
                        (TILE_WIDTH/2), (TILE_HEIGHT/2), 
                        x*(TILE_WIDTH/2), y*(TILE_HEIGHT/2));
                }
            }
        }
    }


    private drawWater(canvas : Canvas, dx : number, dy : number) : void {

        const AMPLITUDE = 8;
        const YOFF = 40;

        let baseWave = this.staticAnimationTimer * Math.PI*2;
        let wave : number;

        let xshift = (Math.floor(dx / TILE_WIDTH) % 2) * TILE_WIDTH;
        let px : number;

        dy += YOFF;
        
        canvas.setColor(170, 255, 255, 0.75);
        for (let x = 0; x < TILE_WIDTH; ++ x) {

            px = x + xshift;

            wave = Math.round(Math.sin(baseWave + (Math.PI*2) / (TILE_WIDTH*2) * px) * 
                   AMPLITUDE * Math.sin(Math.PI*4 / (TILE_WIDTH*2) * px));
            canvas.fillRect(dx + x, dy + wave, 1, TILE_HEIGHT - (wave + YOFF));
        }

        canvas.setColor();
    }


    private drawNonTerrainStaticTiles(canvas : Canvas, bmp : Bitmap | undefined, shadowLayer = false) : void {

        const BRIDGE_OFF = -2;
        const FLAME_AMPLITUDE = 4;

        let dx : number;
        let dy : number;
        let shift : number;
        let phase : number;

        this.activeState.iterate(0, (x : number, y : number, v : number) => {

            dx = x*TILE_WIDTH;
            dy = y*TILE_HEIGHT;

            switch (v) {

            // Ladder
            case 2:

                for (let j = 0; j < 2; ++ j) {

                    canvas.drawBitmapRegion(bmp, 
                        TILE_WIDTH*3, TILE_HEIGHT*3 - TILE_HEIGHT/2, 
                        TILE_WIDTH, TILE_HEIGHT/2, 
                        dx, dy + j*TILE_HEIGHT/2);
                }
                if (y > 0 && this.baseTilemap[(y-1)*this.width + x] != 2) {

                    canvas.drawBitmapRegion(bmp, 
                        TILE_WIDTH*3, TILE_HEIGHT*2,
                         TILE_WIDTH, TILE_HEIGHT/2, 
                         dx, dy - TILE_HEIGHT/2);
                }
                break;

            // Bridge
            case 3:

                canvas.drawBitmapRegion(bmp, 0, TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT, dx, dy + BRIDGE_OFF);
                break;

            // Flame
            case 5:

                shift = -Math.sin(this.staticAnimationTimer * Math.PI * 2) * FLAME_AMPLITUDE;
                canvas.drawHorizontallyWavingBitmapRegion(
                    bmp, TILE_WIDTH, TILE_HEIGHT*2, TILE_WIDTH, TILE_HEIGHT, dx + shift, dy,
                    this.staticAnimationTimer * Math.PI*2,
                    Math.PI*6 / TILE_HEIGHT, FLAME_AMPLITUDE);
                break;

            // Spikes
            case 6:

                canvas.drawBitmapRegion(bmp, 
                    TILE_WIDTH*3, TILE_HEIGHT/2, 
                    TILE_WIDTH, TILE_HEIGHT/2, 
                    dx, dy+TILE_HEIGHT/2);
                break;

            // Water
            case 7:

                if (!shadowLayer)
                    this.drawWater(canvas, dx, dy);
                break;

            // Ice block
            case 8:

                canvas.drawBitmapRegion(bmp, 0, TILE_HEIGHT*2, TILE_WIDTH, TILE_HEIGHT, dx, dy);
                break;

            // Breaking block
            case 9:

                canvas.drawBitmapRegion(bmp, TILE_WIDTH, TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT, dx, dy);
                break;

            // Button
            case 11:

                if (this.activeState.getTile(1, x, y) == 0) {
                //   || (this.moving && this.moveTimer < 0.5)) {

                    canvas.drawBitmapRegion(bmp, 
                        TILE_WIDTH*2, TILE_HEIGHT*2 + TILE_HEIGHT/2, 
                        TILE_WIDTH, TILE_HEIGHT/2, 
                        dx, dy + TILE_HEIGHT/2);
                }
                else {

                    canvas.drawBitmapRegion(bmp, 
                        TILE_WIDTH*2, TILE_HEIGHT*2, 
                        TILE_WIDTH, TILE_HEIGHT/2, 
                        dx, dy + TILE_HEIGHT/2);
                }
                break;

            // Toggleable blocks
            case 12:
            case 13:
                    
                canvas.drawBitmapRegion(bmp, 
                    TILE_WIDTH*3 - (v-12)*TILE_WIDTH, TILE_HEIGHT, 
                    TILE_WIDTH, TILE_HEIGHT, dx, dy);
                break;

            // Keyhole
            case 14:

                canvas.drawBitmapRegion(bmp, 0, TILE_HEIGHT*3, TILE_WIDTH, TILE_HEIGHT, dx, dy);
                break;

            // Key
            case 15:
                
                phase = (x % 2 == y % 2) ? 0.5 : 0;
                shift = Math.sin((this.staticAnimationTimer + phase) * Math.PI * 2) * 4; 
                canvas.drawBitmapRegion(bmp, TILE_WIDTH, TILE_HEIGHT*3, TILE_WIDTH, TILE_HEIGHT, dx, dy + shift);
                break;

            default:
                break;
            }
        });
    }


    private drawAnimatedFigure(canvas : Canvas, bmp : Bitmap | undefined, 
        x : number, y : number, dx : number, dy : number, 
        direction : Direction) : void {
    
        let frame = 0;
        let horizontal = direction == Direction.Left || direction == Direction.Right;
        let climbing = false;
    
        // Check if climbing
        if (!horizontal &&
            (this.activeState.getTile(0, x, y) == 2 &&
            (this.activeState.getTile(0, x, y+1) != 1 || direction == Direction.Down)) ||
            (direction == Direction.Up && this.activeState.getTile(0, x, y+1) == 2)) {
                
            climbing = true;
            frame = 6;
            if (direction != Direction.None) {
    
                frame += Math.floor(this.moveTimer * 2);
            }
        }
        // Or falling
        else if (direction == Direction.Down && 
            this.activeState.getTile(0, x, y) != 2 && 
            this.activeState.getTile(1, x, y+1) != 4) {
    
            frame = 5;
        }
        // Or not being carried, so can be animated
        else if (direction != Direction.None && 
            (this.activeState.getTile(1, x, y+1) != 4 || 
            (y < this.height-1 && this.moveData[(y+1) * this.width + x] == Direction.None))) {
    
            frame = 1 + Math.floor(4 * this.moveTimer);
        }
    
        let row = 0;
        if (!climbing && this.activeState.getTile(1, x, y-1) == 4)
            row = 1;
    
        canvas.drawBitmapRegion(bmp, 
                frame*96, row*96, 96, 96, 
                dx - 8, dy - 7, this.activeState.getFlip());
    }


    private drawDynamicObjects(canvas : Canvas, bmp : Bitmap | undefined) : void {
    
        const DX = [0, 1, 0, -1, 0];
        const DY = [0, 0, -1, 0, 1];
    
        let dx = 0;
        let dy = 0;
        let direction : Direction;
    
        this.activeState.iterate(1, (x : number, y : number, value : number) => {
    
            direction = this.moveData[y * this.width + x];
    
            dx = x*TILE_WIDTH;
            dy = y*TILE_HEIGHT;
    
            if (direction != Direction.None) {
    
                dx -= DX[Number(direction)] * (1.0 - this.moveTimer) * TILE_WIDTH;
                dy -= DY[Number(direction)] * (1.0 - this.moveTimer) * TILE_HEIGHT;
            }
            
            switch (value) {
    
            // Human
            case 4:
                this.drawAnimatedFigure(canvas, bmp, x, y, dx, dy, direction);
                break;
    
            // Boulder
            case 10:
    
                canvas.drawBitmapRegion(bmp, 576, 96, 96, 96, dx-8, dy-7);
                break;
    
            default:
                break;
            }
        });
    }


    private drawStageClearText(canvas : Canvas, bmpFont : Bitmap | undefined) : void {

        const WAIT_TIME = 60;
        const OFFSET = -18;
        const Y_OFF = 200;
        const SCALE = 2.0;

        const MESSAGES = ["STAGE", "CLEAR"];

        let px = canvas.width/2 - (64 + OFFSET) * 5 / 2.0;
        let t = Math.min(1.0, (1.0 - (this.clearTimer - WAIT_TIME) / (CLEAR_WAIT_TIME - WAIT_TIME))) * 5;

        let dx : number;
        let dy : number;

        let end = Math.floor(t);
        let alpha : number;

        let scale : number;

        for (let j = 0; j < Math.min(5, end + 1); ++ j) {
            
            dx = px + j * (64 + OFFSET) + (64 + OFFSET)/2;

            dy = 0;
            alpha = 1.0;
            scale = 1.0;
            if (j == end) {

                dy = Y_OFF * (1.0 - (t % 1.0));
                alpha = (t % 1.0);
                scale = 1.0 + SCALE * (1.0 - (t % 1.0));
            }
            canvas.setColor(255, 255, 255, alpha);

            dx -= (64 + OFFSET) * scale / 2;

            canvas.drawText(bmpFont, MESSAGES[0].charAt(j), dx, canvas.height/2-64 - dy, 
                        0, 0, TextAlign.Left, scale, scale)
                  .drawText(bmpFont, MESSAGES[1].charAt(j), dx, canvas.height/2-2 + dy,
                        0, 0, TextAlign.Left, scale, scale);
            
        }
        canvas.setColor();
    }


    private drawStageStart(canvas : Canvas, bmpFont : Bitmap | undefined) : void {

        canvas.setColor(0, 0, 0, 0.33)
              .fillRect()
              .setColor()
              .drawText(bmpFont, "STAGE " + Number(this.stageIndex | 0), 
                    canvas.width/2, canvas.height/2-16, -18, 0, TextAlign.Center);
    }


    public restart() : void {

        // There is a bug that requires this...
        if (!this.moving)
            this.oldState = this.activeState.clone();

        this.pushState();
        this.activeState = new PuzzleState(
            this.baseTilemap,
            this.baseTilemap.map(v => Number(DYNAMIC_TILES.includes(v)) * v),
            this.width, this.height, Flip.None);
        this.moveData = (new Array<Direction> (this.width*this.height)).fill(Direction.None);

        this.activeState.setFlip(Flip.None);
    }


    public undo() : void {

        let s = this.moving ? this.oldState : this.states.pop();
        if (s == null)
            return;

        this.activeState = s.clone();

        this.moving = false;
        this.moveTimer = 0;
        this.moveData.fill(Direction.None);
    }


    public update(event : CoreEvent, assets : Assets) : boolean {

        this.move(assets, event);
        if (!this.cleared) {

            if (this.startTimer > 0) {

                this.startTimer -= event.step;
            }
            else {

                this.control(assets, event);

                if (event.input.getAction("undo") == InputState.Pressed) {

                    event.audio.playSample(assets.getSample("choose"), 0.60);
                    this.undo();
                }
                else if (event.input.getAction("restart") == InputState.Pressed) {

                    event.audio.playSample(assets.getSample("choose"), 0.60);
                    this.restart();
                }
            }
        }
        else {

            if ((this.clearTimer -= event.step) <= 0) {

                return true;
            }
        }
        return false;
    }


    public updateBackground(event : CoreEvent) : void {
        
        const STATIC_ANIMATION_SPEED = 0.025;

        this.staticAnimationTimer = (this.staticAnimationTimer + STATIC_ANIMATION_SPEED*event.step) % 1.0;

        for (let r of this.rubble) {

            r.update(event);
        }
        for (let s of this.stars) {

            s.update(event);
        }
        for (let b of this.bats) {

            b.update(event);
        }
        for (let l of this.locks) {

            l.update(event);
        }

        this.snowfall.update(event);
    }


    public drawObjectsWithShadow(canvas : Canvas, shadowLayer = false) : void {

        let bmpStaticTiles = canvas.getBitmap("staticTiles");
        let bmpFigure = canvas.getBitmap("figure");
        let bmpBat = canvas.getBitmap("bat");

        this.drawNonTerrainStaticTiles(canvas, bmpStaticTiles, shadowLayer);
        this.drawTerrain(canvas, bmpStaticTiles);

        for (let r of this.rubble) {

            r.draw(canvas, bmpStaticTiles);
        }

        this.drawDynamicObjects(canvas, bmpFigure);

        for (let b of this.bats) {

            b.draw(canvas, bmpBat);
        }
    }


    public drawObjectsWithoutShadow(canvas : Canvas) : void {
    
        let bmpStaticTiles = canvas.getBitmap("staticTiles");
        let bmpFontBig = canvas.getBitmap("fontBig");
        let bmpStars = canvas.getBitmap("stars");

        for (let l of this.locks) {

            l.draw(canvas, bmpStaticTiles);
        }

        for (let s of this.stars) {

            s.draw(canvas, bmpStars);
        }

        this.snowfall.draw(canvas);

        if (this.cleared) {

            canvas.setColor(0, 0, 0, 0.33)
                  .fillRect()
                  .setColor();
            this.drawStageClearText(canvas, bmpFontBig);
        }
        
        if (this.startTimer > 0) {

            this.drawStageStart(canvas, bmpFontBig);
        }
    }


    public changeStage(index : number, event : CoreEvent) : void {

        let map = event.assets.getTilemap(String(index));
        if (map == undefined) {

            throw "No level data for map index " + String(index);
        }
        this.baseTilemap = Array.from(map.cloneLayer(1) as number[]);

        this.states.length = 0;
        this.activeState = new PuzzleState(
            this.baseTilemap,
            this.baseTilemap.map(v => Number(DYNAMIC_TILES.includes(v)) * v),
            this.width, this.height, Flip.None);
        this.states.push(this.activeState.clone());
        this.oldState = this.activeState.clone();

        this.moveData.fill(Direction.None);
        this.terrainMap = createTerrainMap(this.baseTilemap, this.width, this.height);

        this.cleared = false;
        this.clearTimer = 0;

        this.startTimer = START_TIME;

        this.stageIndex = index;
    
        for (let r of this.rubble) {
            
            r.kill();
        }
        for (let s of this.stars) {

            s.kill();
        }
        for (let b of this.bats) {

            b.kill();
        }
        for (let l of this.locks) {

            l.kill();
        }
        

        this.snowfall.shuffle();
    }


    public canBeInterrupted = () : boolean => !this.cleared && this.startTimer <= 0;
}
