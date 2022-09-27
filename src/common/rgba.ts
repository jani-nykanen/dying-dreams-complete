

export class RGBA {

	public r : number;
	public g : number;
	public b : number;
	public a : number;


	constructor(r = 1, g = r, b = g, a = 1) {

		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}


    public clone = () : RGBA => new RGBA(this.r, this.g, this.b, this.a);


	static scalarMultiply = (color : RGBA, scalar : number) : RGBA => 
		new RGBA(color.r * scalar, color.g * scalar, color.b * scalar, color.a);


	static white = () : RGBA => new RGBA(255);
    static black = () : RGBA => new RGBA(0);

}
