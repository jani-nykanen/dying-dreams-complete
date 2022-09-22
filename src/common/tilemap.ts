
export class Tilemap {


    private layers : Map<number, number[]>;
    private properties : Map<string, string>;

    public readonly width : number;
    public readonly height : number;


    constructor(xmlString : string) {

        let doc = (new DOMParser()).parseFromString(xmlString, "text/xml");
        let root = doc.getElementsByTagName("map")[0];

        this.width = Number(root.getAttribute("width"));
        this.height = Number(root.getAttribute("height"));

        let data = root.getElementsByTagName("layer");
        if (data == null) {

            throw "Tilemap missing layers!";
        }

        this.layers = new Map<number, number[]> ();

        let content : Array<string> | undefined;
        for (let i = 0; i < data.length; ++ i) {

            // I guess this beats typecasting to any...
            content = data[i].getElementsByTagName("data")[0]?.childNodes[0]?.nodeValue?.replace(/(\r\n|\n|\r)/gm, "")?.split(",");
            if (content == undefined)
                continue;

            this.layers.set(Number(data[i].id), content.map((v : string) => Number(v)));
        }

        this.properties = new Map<string, string> ();

        let prop = root.getElementsByTagName("properties")[0];
        if (prop != undefined) {

            for (let p of <any>prop.getElementsByTagName("property")) {

                if ( p.getAttribute("name") != undefined) {

                    this.properties.set(p.getAttribute("name"), p.getAttribute("value"));
                }
            }
        }   
    }


    public getTile(layerIndex : number, x : number, y : number, def = -1) : number {

        let layer = this.layers.get(layerIndex);
        if (layer == undefined || x < 0 || y < 0 || x >= this.width || y >= this.height)
            return def;

        return layer[y * this.width + x];
    }


    public getIndexedTile = (layer : number, i : number) => this.getTile(layer, i % this.width, (i / this.width) | 0);


    public cloneLayer(layerIndex : number) : Array<number> | null {

        let layer = this.layers.get(layerIndex);
        if (layer == undefined)
            return null;

        return Array.from(layer);
    }


    public getProperty(name : string) : string | null {

        for (let [key, value] of this.properties) {

            if (key == name)
                return value;
        }
        return null;
    }
}