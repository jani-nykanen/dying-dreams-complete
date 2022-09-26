import { RGBA } from "../common/rgba.js";
import { Bitmap } from "./bitmap.js";
import { Mesh } from "./mesh.js";
import { Shader } from "./shader.js";
import { FragmentSource, VertexSource } from "./shadersource.js";
import { Transformations } from "./transform.js";


export const enum ShaderType {

    Textured = 0,
    NoTexture = 1,
    TexturedFixedColor = 2,
    TexturedWaves = 3,
    
    Last = 3,
};


const createCanvasElement = (width : number, height : number) : [HTMLCanvasElement, WebGLRenderingContext] => {

    let div = document.createElement("div");
    div.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");
    
    let canvas = document.createElement("canvas");
    canvas.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");

    canvas.width = width;
    canvas.height = height;

    div.appendChild(canvas);
    document.body.appendChild(div);

    return [
        canvas, 
        canvas.getContext("webgl", {alpha: false, antialias: false, /*stencil: true*/}) as WebGLRenderingContext
    ];
}


export class Renderer {

    private canvas : HTMLCanvasElement;
    private glCtx : WebGLRenderingContext;

    // To make sure we do not need to access canvas element
    // each frame
    private canvasWidth : number = 0;
    private canvasHeight : number = 0;

    private shaders : Array<Shader>;
    private activeShader : Shader;

    private activeMesh : Mesh | null = null;
    private activeTexture : Bitmap | null = null;
    private activeColor : RGBA = RGBA.white();

    private meshRectangle : Mesh;

    public readonly transform : Transformations;


    public get width() : number {

        return this.canvasWidth;
    }


    public get height() : number {

        return this.canvasHeight;
    }


    constructor() {

        [this.canvas, this.glCtx] = createCanvasElement(window.innerWidth, window.innerHeight);

        this.resize(window.innerWidth, window.innerHeight);

        this.initOpenGL();

        window.addEventListener("resize", () => this.resize(
            window.innerWidth, window.innerHeight));

        this.shaders = new Array<Shader> (ShaderType.Last + 1);
        
        this.shaders[ShaderType.Textured] = new Shader(this.glCtx, 
            VertexSource.Textured, FragmentSource.Textured); 
        this.shaders[ShaderType.NoTexture] = new Shader(this.glCtx, 
            VertexSource.NoTexture, FragmentSource.NoTexture); 
        this.shaders[ShaderType.TexturedFixedColor] = new Shader(this.glCtx, 
            VertexSource.Textured, FragmentSource.TexturedFixedColor);  
        this.shaders[ShaderType.TexturedWaves] = new Shader(this.glCtx, 
            VertexSource.Textured, FragmentSource.TexturedWaves);      

        this.activeShader = this.shaders[0];
        this.activeShader.use();

        this.meshRectangle = this.createRectangleMesh();
        this.meshRectangle.bind(this.glCtx);

        this.transform = new Transformations(this.activeShader);
    }


    private createRectangleMesh = () : Mesh =>
        new Mesh(
            this.glCtx,
            new Float32Array([
                0, 0,
                1, 0,
                1, 1,
                0, 1,
            ]),
            new Uint16Array([
                0, 1, 2, 
                2, 3, 0
            ]),
            new Float32Array([
                0, 0,
                1, 0,
                1, 1,
                0, 1
        ]));
    

    private initOpenGL() : void {

        let gl = this.glCtx;

        // gl.disable(gl.SCISSOR_TEST);

        gl.activeTexture(gl.TEXTURE0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, 
            gl.ONE_MINUS_SRC_ALPHA, gl.ONE, 
            gl.ONE_MINUS_SRC_ALPHA);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);

        gl.stencilMask(0xff);
        gl.disable(gl.STENCIL_TEST);
    }


    private resize(width : number, height : number) : void {

        let gl = this.glCtx;

        gl.viewport(0, 0, width, height);
        this.canvas.width = width;
        this.canvas.height = height;

        // Heh
        this.canvasWidth = width;
        this.canvasHeight = height;
    }


    private useShader(newShader : Shader | null) : void {

        if (newShader === null || newShader === this.activeShader) 
            return;

        this.activeShader = newShader;
        this.activeShader.use();

        this.transform.setActiveShader(this.activeShader);
        this.transform.use();    

        this.activeShader.setColor(
            this.activeColor.r, 
            this.activeColor.g, 
            this.activeColor.b, 
            this.activeColor.a);
    }


    public clear(r = 1, g = r, b = g) : void {

        let gl = this.glCtx;

        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.clearColor(r, g, b, 1.0);
    }


    public bindMesh(mesh : Mesh = this.meshRectangle) : void {

        if (this.activeMesh === mesh) return;

        mesh.bind(this.glCtx);
    }


    public rebindMesh() : void {
        
        this.activeMesh?.bind(this.glCtx);
    }


    public bindTexture(bmp : Bitmap | null) {

        bmp?.bind(this.glCtx);
        this.activeTexture = bmp;
    }


    public rebindTexture() : void {
        
        this.activeTexture?.bind(this.glCtx);
    }


    public resetVertexAndFragmentTransforms() : void {

        this.activeShader.setVertexTransform(0, 0, 1, 1);
        this.activeShader.setFragTransform(0, 0, 1, 1);
    }


    public setVertexTransform(x : number, y : number, w : number, h : number) : void {

        this.activeShader.setVertexTransform(x, y, w, h);
    }


    public setFragmentTransform(x = 0.0, y = 0.0, w = 1.0, h = 1.0) : void {

        this.activeShader.setFragTransform(x, y, w, h);
    }


    public changeShader(type : ShaderType) : void {

        this.useShader(this.shaders[type]);
    }


    public setColor(r = 1, g = r, b = g, a = 1, storeOld = true) : void {

        this.activeShader.setColor(r, g, b, a);
        if (storeOld) {
            
            this.activeColor = new RGBA(r, g, b, a);
        }
    }


    public drawMesh(mesh : Mesh = this.meshRectangle) : void {

        this.bindMesh(mesh);
        mesh.draw(this.glCtx);
    }


    public createBitmap(image : HTMLImageElement) : Bitmap {

        return new Bitmap(this.glCtx, image);
    }


    public createFramebuffer(width : number, height : number, filter = false) : Bitmap {

        return new Bitmap(this.glCtx, undefined, true, width, height, filter);
    }


    public constructMesh = (vertices : Float32Array, 
        indices : Uint16Array,
        textureCoordinates? : Float32Array) : Mesh => 
            (new Mesh(this.glCtx, vertices, indices, textureCoordinates));

    
    public destroyMesh(mesh : Mesh) : void {

        mesh.dispose(this.glCtx);
    }


    public resetColor() : void {
        
        this.activeShader.setColor(
            this.activeColor.r, 
            this.activeColor.g, 
            this.activeColor.b, 
            this.activeColor.a);
    }


    public setWaveParameters(wave : number, period : number, amplitude : number) : void {

        this.activeShader.setWaveParameters(wave, period, amplitude);
    }
    

    public clearStencilBuffer() : void {

        let gl = this.glCtx;

        gl.clear(gl.STENCIL_BUFFER_BIT);
    }


    public toggleStencilTest(state : boolean) : void {

        let gl = this.glCtx;

        if (state) {

            gl.enable(gl.STENCIL_TEST);
        }
        else {

            gl.disable(gl.STENCIL_TEST);
        }
    }

}
