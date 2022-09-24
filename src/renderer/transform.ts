import { Matrix3 } from "../common/matrix.js";
import { Vector2 } from "../common/vector.js";
import { Shader } from "./shader.js";



export class Transformations {
    

    private model : Matrix3;
    private modelStack : Array<Matrix3>;
    private view : Matrix3;
    private product : Matrix3;
    private productComputed : boolean;

    private viewport : Vector2;

    private activeShader : Shader;


    constructor(activeShader : Shader) {

        this.model = Matrix3.identity();
        this.modelStack = new Array<Matrix3> ();
        this.view = Matrix3.identity();
        this.product = Matrix3.identity();
    
        this.productComputed = true;

        this.viewport = new Vector2(1, 1);

        this.activeShader = activeShader;
    }


    private computeProduct() : void  {

        if (this.productComputed) return;

        this.product = Matrix3.multiply(this.view, this.model);
        this.productComputed = true;
    }


    public setActiveShader(shader : Shader) {

        this.activeShader = shader;
    }


    public loadIdentity() : Transformations {

        this.model = Matrix3.identity();
        this.productComputed = false;

        return this;
    }


    public translate(x = 0, y = 0) : Transformations {

        this.model = Matrix3.multiply(this.model, Matrix3.translate(x, y));

        this.productComputed = false;

        return this;
    }


    public scale(sx = 1, sy = 1) : Transformations {

        this.model = Matrix3.multiply(
            this.model,
            Matrix3.scale(sx, sy));
        this.productComputed = false;

        return this;
    }


    public rotate(angle = 0) : Transformations {

        this.model = Matrix3.multiply(this.model, Matrix3.rotate(angle));

        this.productComputed = false;

        return this;
    }


    public setView(width : number, height : number) : Transformations {

        this.view = Matrix3.view(0, width, height, 0);
        this.productComputed = false;

        this.viewport = new Vector2(width, height);

        return this;
    }


    public fitHeight(height : number, aspectRatio : number) : Transformations {

        let width = height * aspectRatio;

        return this.setView(width, height);
    }


    public fitGivenDimension(dimension : number, aspectRatio : number) : Transformations {

        if (aspectRatio >= 1) {

            return this.fitHeight(dimension, aspectRatio);
        }
        else {

            return this.setView(dimension, dimension / aspectRatio);
        }
    }

    public push() : Transformations {

        if (this.modelStack.length == 128) {

            throw "Model stack got too big, beep boop!";
        }

        this.modelStack.push(this.model.clone());
        return this;
    }


    public pop() : Transformations {

        let m = this.modelStack.pop();
        if (m == null)
            return this;

        this.model = m;
        this.productComputed = false;

        return this;
    }


    public use() : void  {

        this.computeProduct();
        this.activeShader.setTransformMatrix(this.product);
    }


    public getViewport = () : Vector2 => this.viewport.clone();


    public clearStacks() : void {

        this.modelStack.length = 0;
    }
}
