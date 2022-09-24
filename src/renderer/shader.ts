import { Matrix3 } from "../common/matrix.js";


enum Uniform {

    Transform = 0,
    VertexPos = 1,
    VertexScale = 2,
    TexturePos = 3,
    TextureScale = 4,
    Color = 5,
    TextureSampler = 6,
    Amplitude = 7,
    Period = 8,
    Wave = 9,

    Last = 9
};


const UNIFORM_NAMES = [

    "transform",
    "pos",
    "scale",
    "texPos",
    "texScale",
    "color",
    "texSampler",
    "amplitude",
    "period",
    "wave"
];


export class Shader {


    private uniforms : Array<WebGLUniformLocation | null>; // Why not map?
    private program : WebGLShader;

    private readonly gl : WebGLRenderingContext;


    constructor(gl : WebGLRenderingContext, vertexSource : string, fragmentSource : string) {

        this.gl = gl;

        this.uniforms = new Array<WebGLUniformLocation> (Uniform.Last + 1);
        this.program = this.buildShader(vertexSource, fragmentSource);

        this.getUniformLocations();
    }
    

    private createShader(src : string, type : number) : WebGLShader {

        let gl = this.gl
    
        let shader = gl.createShader(type) as WebGLShader;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
    
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    
            throw "Shader error:\n" + 
                gl.getShaderInfoLog(shader);
                
        }
        return shader;
    }


    private buildShader(vertexSource : string, fragmentSource : string) : WebGLShader {

        let gl = this.gl;
    
        let vertex = this.createShader(vertexSource, gl.VERTEX_SHADER);
        let frag = this.createShader(fragmentSource, gl.FRAGMENT_SHADER);
    
        let program = gl.createProgram() as WebGLProgram;
        gl.attachShader(program, vertex);
        gl.attachShader(program, frag);
    
        this.bindLocations(program);

        gl.linkProgram(program);
    
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    
            throw "Shader error: " + gl.getProgramInfoLog(program);
        }
        return program;
    }

    
    private bindLocations(program : WebGLShader) : void {

        let gl = this.gl;

        gl.bindAttribLocation(program, 0, "vertexPos");
        gl.bindAttribLocation(program, 1, "vertexUV");
    }


    private getUniformLocations() : void {

        for (let i = 0; i < Uniform.Last+1; ++ i) {

            this.uniforms[i] = this.gl.getUniformLocation(this.program, UNIFORM_NAMES[i]);
        }
    }


    public use() : void {

        let gl = this.gl;
    
        gl.useProgram(this.program);
        this.getUniformLocations();

        gl.uniform1i(this.uniforms[Uniform.TextureSampler], 0);

        this.setVertexTransform(0, 0, 1, 1);
        this.setFragTransform(0, 0, 1, 1);
        this.setTransformMatrix(Matrix3.identity());
        this.setColor(1, 1, 1, 1);
    }


    public setVertexTransform(x : number, y : number, w : number, h : number) : void {

        let gl = this.gl;

        gl.uniform2f(this.uniforms[Uniform.VertexPos], x, y);
        gl.uniform2f(this.uniforms[Uniform.VertexScale], w, h);
    }


    public setFragTransform(x : number, y : number, w : number, h : number) : void {

        let gl = this.gl;

        gl.uniform2f(this.uniforms[Uniform.TexturePos], x, y);
        gl.uniform2f(this.uniforms[Uniform.TextureScale], w, h);
    }


    public setColor(r = 1, g = 1, b = 1, a = 1) : void {

        let gl = this.gl;
        gl.uniform4f(this.uniforms[Uniform.Color], r, g, b, a);
    }


    public setTransformMatrix(matrix : Matrix3) : void {

        matrix.passToShader(this.gl, this.uniforms[Uniform.Transform]);
    }


    public setWaveParameters(wave : number, period : number, amplitude : number) : void {

        let gl = this.gl;
        gl.uniform1f(this.uniforms[Uniform.Wave], wave);
        gl.uniform1f(this.uniforms[Uniform.Period], period);
        gl.uniform1f(this.uniforms[Uniform.Amplitude], amplitude);
    }
}
