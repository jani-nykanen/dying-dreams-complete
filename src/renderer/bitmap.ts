

export class Bitmap {


    private texture : WebGLTexture | null;
    private framebuffer : WebGLFramebuffer | null = null;

    private readonly gl : WebGLRenderingContext;

    public readonly width : number;
    public readonly height : number;


    constructor(gl : WebGLRenderingContext, image : HTMLImageElement | undefined, 
        makeFramebuffer = false, width = 256, height = 256, linearFilter = false) {

        this.texture = gl.createTexture();
        this.gl = gl;

        let filter = linearFilter ? gl.LINEAR : gl.NEAREST;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
        if (image != undefined) {

            gl.texImage2D(gl.TEXTURE_2D, 
                0, gl.RGBA, gl.RGBA, 
                gl.UNSIGNED_BYTE, image);

            this.width = image.width;
            this.height = image.height;
        }
        else {

            gl.texImage2D(gl.TEXTURE_2D, 
                0, gl.RGBA, width, height, 0, 
                gl.RGBA, gl.UNSIGNED_BYTE, null);

            this.width = width;
            this.height = height;
        }

        this.framebuffer = null;
        if (makeFramebuffer) {

            this.framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                gl.TEXTURE_2D, this.texture, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }


    public bind(gl : WebGLRenderingContext) : void {

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }


    public drawTo(func : (gl : WebGLRenderingContext) => void) : void {

        if (this.framebuffer == null) return;

        const gl = this.gl;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        func(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}
