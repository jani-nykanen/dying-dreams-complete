import { Vector2 } from "../common/vector.js";
import { Assets } from "../io/assets.js";
import { Bitmap } from "./bitmap.js";
import { Renderer, ShaderType } from "./renderer.js";
import { Sprite } from "./sprite.js";
import { Transformations } from "./transform.js";


export const enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
    Both = 1 | 2
};


export const enum TextAlign {

    Left = 0,
    Center = 1,
    Right = 2
};


export class Canvas {
    
    
    private readonly renderer : Renderer;

    private transition : Vector2;

    private framebuffer : Bitmap;

    private silhouetteActive : boolean = false;

    private readonly assets : Assets;

    public readonly width : number;
    public readonly height : number;

    // A lazy way to add support for rotated bitmaps...
    public get transform() : Transformations {

        return this.renderer.transform;
    }


    constructor(renderer : Renderer, width : number, height : number, assets : Assets) {

        this.renderer = renderer;

        this.transition = new Vector2();

        this.framebuffer = this.renderer.createFramebuffer(width, height, true);

        this.assets = assets;

        this.width = width;
        this.height = height;
    }


    public drawScaledBitmapRegion(bmp : Bitmap | undefined, 
        sx : number, sy : number, sw : number, sh : number, 
        dx : number, dy : number, dw : number, dh : number,
        flip = Flip.None) : Canvas {

        if (bmp == undefined)
            return this;

        dx += this.transition.x;
        dy += this.transition.y;

        if ((flip & Flip.Horizontal) == Flip.Horizontal) {

            dx += dw;
            dw *= -1;
        }

        if ((flip & Flip.Vertical) == Flip.Vertical) {

            dy += dh;
            dh *= -1;
        }

        sx /= bmp.width;
        sy /= bmp.height;

        sw /= bmp.width;
        sh /= bmp.height;

        if (this.silhouetteActive) {

            this.renderer.changeShader(ShaderType.TexturedFixedColor);
        }
        else {

            this.renderer.changeShader(ShaderType.Textured);
        }

        this.renderer.setVertexTransform(dx, dy, dw, dh);
        this.renderer.setFragmentTransform(sx, sy, sw, sh);

        this.renderer.bindTexture(bmp);
        this.renderer.bindMesh();
        this.renderer.drawMesh();

        return this;
    }


    public drawBitmapRegion(bmp : Bitmap | undefined, 
        sx : number, sy : number, sw : number, sh : number, 
        dx : number, dy : number, flip = Flip.None) : Canvas {

        this.drawScaledBitmapRegion(bmp, sx, sy, sw, sh, dx, dy, sw, sh, flip);
        return this;
    }


    public drawBitmap(bmp : Bitmap | undefined, dx : number, dy : number, flip = Flip.None) : Canvas {

        if (bmp == undefined)
            return this;

        let sw = bmp.width;
        let sh = bmp.height;

        this.drawScaledBitmapRegion(bmp, 0, 0, sw, sh, dx, dy, sw, sh, flip);

        return this;
    }


    public drawScaledBitmap(bmp : Bitmap | undefined, 
        dx : number, dy : number, dw : number, dh : number, 
        flip = Flip.None) : Canvas {

        if (bmp == undefined)
            return this;

        let sw = bmp.width;
        let sh = bmp.height;

        this.drawScaledBitmapRegion(bmp, 0, 0, sw, sh, dx, dy, dw, dh, flip);

        return this;
    }

 
    public drawVerticallyWavingBitmap(bmp : Bitmap | undefined, 
        dx : number, dy : number, wave : number, period : number, amplitude : number) : Canvas {

        if (bmp == undefined)
            return this;

        dx += this.transition.x;
        dy += this.transition.y;

        this.renderer.changeShader(ShaderType.TexturedWaves);
        this.renderer.setWaveParameters(wave, period, amplitude);

        this.renderer.setVertexTransform(dx, dy, bmp.width, bmp.height);
        this.renderer.setFragmentTransform(0, 0, 1, 1);

        this.renderer.bindTexture(bmp);
        this.renderer.bindMesh();
        this.renderer.drawMesh();

        return this;
    }



    public fillRect(x = 0, y = 0, w = this.width, h = this.height) : Canvas {

        this.renderer.changeShader(ShaderType.NoTexture);
        
        this.renderer.setVertexTransform(x, y, w, h);
        this.renderer.bindMesh();
        this.renderer.drawMesh();

        return this;
    }


    public drawText(font : Bitmap | undefined, str : string, 
        dx : number, dy : number, 
        xoff = 0.0, yoff = 0.0, align = TextAlign.Left,
        scalex = 1.0, scaley = 1.0) : Canvas {

        if (font == undefined)
            return this;

        let cw = (font.width / 16) | 0;
        let ch = cw;

        let x = dx;
        let y = dy;
        let chr : number;

        if (align == TextAlign.Center) {

            dx -= ((str.length+1) * (cw + xoff)) * scalex / 2.0 ;
            x = dx;
        }
        else if (align == TextAlign.Right) {
            
            dx -= ((str.length) * (cw + xoff)) * scalex;
            x = dx;
        }

        for (let i = 0; i < str.length; ++ i) {

            chr = str.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {

                x = dx;
                y += (ch + yoff) * scaley;
                continue;
            }

            this.drawScaledBitmapRegion(font, 
                (chr % 16) * cw, ((chr/16)|0) * ch, cw, ch, 
                x, y, cw*scalex, ch*scaley);

            x += (cw + xoff) * scalex;
        }

        return this;
    }


    public drawSprite(spr : Sprite, bmp : Bitmap | undefined, 
        dx : number, dy : number, flip = Flip.None) : Canvas {

        spr.draw(this, bmp, dx, dy, flip);
        return this;
    }


    public drawSpriteFrame(spr : Sprite, 
        bmp : Bitmap | undefined, 
        column : number, row : number, 
        dx : number, dy : number, flip = Flip.None) : Canvas {

        spr.drawFrame(this, bmp, column, row, dx, dy, flip);
        return this;
    }


    // Basically the same as fillRect with setColor, but does 
    // not required to reset the color after called
    public clear(r = 255, g = r, b = g) : Canvas {

        this.renderer.changeShader(ShaderType.NoTexture);
        this.renderer.setVertexTransform(0, 0, this.width, this.height);

        this.renderer.setColor(r / 255, g / 255, b / 255, 1.0, false);
        this.renderer.bindMesh();
        this.renderer.drawMesh();
        this.renderer.resetColor();

        return this;
    }


    public fillRegularStar(cx : number, cy : number, radius : number) : Canvas {

        let leftx = Math.round(Math.sin(-Math.PI*2/3) * radius);
        let bottomy = -Math.round(Math.cos(-Math.PI*2/3) * radius);

        let x = 0;
        let stepx = bottomy / Math.abs(leftx);

        let rx : number;

        for (let y = -radius; y <= bottomy; ++ y, x += stepx) {

            rx = Math.round(x);

            this.fillRect(cx - rx, cy + y, rx*2, 1);
            this.fillRect(cx - rx, cy + radius - bottomy*2 - y,  rx*2, 1);
        }

        return this;
    }


    public fillEllipse(cx : number, cy : number, w : number, h : number) : Canvas {

        const EPS = 2.0;

        if (w < EPS || h < EPS)
            return this;

        cx |= 0;
        cy |= 0;    

        w /= 2;
        h /= 2;

        let rh = Math.round(h);
        let dw = 0;

        for (let y = cy - rh; y <= cy + rh; ++ y) {

            dw = Math.round(w * Math.sqrt(1 - ((y - cy)*(y - cy)) / (h*h)));
            this.fillRect(cx - dw, y, dw*2, 1);   
        }
        return this;
    }


    public fillCircleOutside(r : number, cx = this.width/2, cy = this.height/2) : Canvas {

        let start = Math.max(0, cy - r) | 0;
        let end = Math.min(this.height, cy + r) | 0;

        if (start > 0)
            this.fillRect(0, 0, this.width, start);
        if (end < this.height)
            this.fillRect(0, end, this.width, this.height - end);

        let dy : number;
        let px1 : number;
        let px2 : number;
        
        for (let y = start; y < end; ++ y) {

            dy = y - cy;

            if (Math.abs(dy) >= r) {

                this.fillRect(0, y, this.width, 1);
                continue;
            }

            px1 = Math.round(cx - Math.sqrt(r*r - dy*dy));
            px2 = Math.round(cx + Math.sqrt(r*r - dy*dy));
            if (px1 > 0)
                this.fillRect(0, y, px1, 1);
            if (px2 < this.width)
                this.fillRect(px2, y, this.width - px1, 1);
        }

        return this;
    }


    // TODO: Implement in shader for better performance!
    public drawHorizontallyWavingBitmapRegion(bmp : Bitmap | undefined, 
        sx : number, sy : number, sw : number, sh : number, 
        dx : number, dy : number,
        wave : number, period : number, amplitude : number) : Canvas {

        if (bmp == undefined)
            return this;

        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;

        dx |= 0;
        dy |= 0;    

        let w = 0.0;
        let tx : number;

        for (let y = 0; y < sh; ++ y) {

            w = wave + period * y;
            tx = dx + Math.round(Math.sin(w) * amplitude);

            this.drawBitmapRegion(bmp, 
                sx, sy + y, sw, 1, 
                tx, dy + y);
        }
        return this;
    }


    public move(x : number, y : number) : Canvas {

        this.transition.x += x;
        this.transition.y += y;

        return this;
    }


    public moveTo(x = 0, y = 0) : Canvas {

        this.transition.x = x;
        this.transition.y = y;

        return this;
    }


    public setColor(r = 255, g = r, b = g, a = 1.0) : Canvas {

        if (this.silhouetteActive)
            return this;

        this.renderer.setColor(r / 255, g / 255, b / 255, a);
        return this;
    }


    public reset() : void {

        this.renderer.transform
            .setView(this.width, this.height)
            .loadIdentity()
            .use();
        this.renderer.setColor();
        this.renderer.resetVertexAndFragmentTransforms();
        this.renderer.transform.clearStacks();
        
        this.moveTo();
    }


    public toggleSilhouetteRendering(state = false) : Canvas {

        this.silhouetteActive = state;
        return this;
    }


    public renderToScreen(preserveSquarePixels = false) : void {

        // No clue why it requires reversing
        this.renderer.clear(0.0);
        this.renderer.transform
            .loadIdentity()
            .translate(0, this.renderer.height)
            .scale(1, -1)
            .setView(this.renderer.width, this.renderer.height)
            .use();

        let m = Math.min(
            this.renderer.width / this.width, 
            this.renderer.height / this.height);
        if (preserveSquarePixels && m >= 1.0) {

            m = Math.floor(m);
        }

        let w = this.width*m;
        let h = this.height*m;
        let x = this.renderer.width/2 - w/2;
        let y = this.renderer.height/2 - h/2;
        
        this.renderer.setColor();
        this.renderer.changeShader(ShaderType.Textured);
        this.renderer.setVertexTransform(x, y, w, h);
        this.renderer.setFragmentTransform();
        this.renderer.bindTexture(this.framebuffer);
        this.renderer.drawMesh();
    }


    public drawTo(func : (canvas : Canvas) => void) {

        this.framebuffer.drawTo((gl : WebGLRenderingContext) => {

            gl.viewport(0, 0, this.width, this.height);

            this.renderer.transform.loadIdentity()
                .setView(this.width, this.height)
                .use();
            func(this);

            gl.viewport(0, 0, this.renderer.width, this.renderer.height);
        });
    }


    public getBitmap = (name : string) : Bitmap | undefined => this.assets.getBitmap(name);
}