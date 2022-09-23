import { Canvas, Flip } from "./canvas.js";
import { Bitmap } from "./bitmap.js";


export class Sprite {


    private row : number;
    private column : number;
    private timer : number;

    public readonly width : number;
    public readonly height : number;


    constructor(w : number, h : number) {

        this.width = w;
        this.height = h;

        this.row = 0;
        this.column = 0;
        this.timer = 0.0;
    }


    public animate(row : number, start : number, end : number, 
        speed : number, steps = 1.0) : void {

        row |= 0;
        start |= 0;
        end |= 0;
        speed |= 0;

        if (start == end) {
    
            this.timer = 0;
            this.column = start;
            this.row = row;
            return;
        }
    
        if (this.row != row) {
        
            this.timer = 0;
            this.column = end > start ? start : end;
            this.row = row;
        }
    
        if ((start < end && this.column < start) ||
            (start > end && this.column > start)) {
        
            this.column = start;
        }
    
        this.timer += steps;
        if(this.timer > speed) {
        
            // Loop the animation, if end reached
            if(start < end) {
            
                if (++ this.column > end) {
                    
                    this.column = start;
                }
            }
            else {
            
                if (-- this.column < end) {
                
                    this.column = start;
                }
            }
    
            this.timer -= speed;
        }
    }


    public setFrame(column : number, row : number, preserveTimer = false) : void {

        this.column = column;
        this.row = row;
        
        if (!preserveTimer)
            this.timer = 0;
    }


    public drawFrame(canvas : Canvas, bmp : Bitmap | undefined, 
        column : number, row : number, 
        dx : number, dy : number, flip = Flip.None) : void {
    
        canvas.drawBitmapRegion(bmp, 
            this.width * column, this.height * row, 
            this.width, this.height, 
            dx, dy, flip);
    }


    public draw(canvas : Canvas, bmp : Bitmap | undefined, 
        dx : number, dy : number, flip = Flip.None) : void {

        this.drawFrame(canvas, bmp, this.column, this.row, dx, dy, flip);
    }


    public getRow = () : number => this.row;
    public getColumn = () : number => this.column;
    public getTimer = () : number => this.timer;
}
