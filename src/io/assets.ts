import { Bitmap } from "../renderer/bitmap.js";
import { loadBitmapRGB222, RGB222LookupTable } from "../game/bitmapgen.js";
import { Sample } from "../audio/sample.js";
import { Tilemap } from "../common/tilemap.js";
import { AudioPlayerGeneral } from "../audio/audioplayer.js";


export class Assets {


    private bitmaps : Map<string, Bitmap>;
    private samples : Map<string, Sample>;
    private tilemaps : Map<string, Tilemap>;

    private loaded : number = 0;
    private totalAssets : number = 0;


    private readonly audioContext : AudioContext;


    constructor(audio : AudioPlayerGeneral) {

        this.bitmaps = new Map<string, Bitmap> ();
        this.samples = new Map<string, Sample> ();
        this.tilemaps = new Map<string, Tilemap> ();

        this.audioContext = audio.getContext();
    }


    private loadTextFile(path : string, type : string, func : (s : string) => void) : void {
        
        ++ this.totalAssets;

        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("text/" + type);
        xobj.open("GET", path, true);

        xobj.onreadystatechange = () => {

            if (xobj.readyState == 4 ) {

                if(String(xobj.status) == "200") {
                    
                    func(xobj.responseText);
                }
                ++ this.loaded;
            }
                
        };
        xobj.send(null);  
    }


    private loadItems(jsonData : any,
        func : (name : string, path : string) => void, 
        basePathName : string, arrayName : string) : void {
        
        let path : string | undefined = jsonData[basePathName];
        let objects : any | undefined = jsonData[arrayName];

        if (path != undefined && objects != undefined) {
                    
            path = jsonData[basePathName];
            for (let o of objects) {

                func(o["name"], path + o["path"]);
            }
        }
    }


    public loadBitmap(name : string, path : string) : void {

        ++ this.totalAssets;

        let image = new Image();
        image.onload = (_ : Event) => {

            ++ this.loaded;
            this.bitmaps.set(name, image);
        }
        image.src = path;
    }


    public loadTilemap(name : string, path : string) : void {

        ++ this.totalAssets;
        
        this.loadTextFile(path, "xml", (str : string) => {

            this.tilemaps.set(name, new Tilemap(str));
            ++ this.loaded;
        });
    }


    public loadSample(name : string, path : string) : void {

        ++ this.totalAssets;

        let xobj = new XMLHttpRequest();
        xobj.open("GET", path, true);
        xobj.responseType = "arraybuffer";

        xobj.onload = () => {

            if (xobj.readyState == 4 ) {
                this.audioContext.decodeAudioData(xobj.response, (data) => {
                    
                    ++ this.loaded;
                    this.samples.set(name, new Sample(this.audioContext, data));

                });
            }
        }
        xobj.send(null);
    }


    public parseIndexFile(path : string) : void {

        this.loadTextFile(path, "json", (s : string) => {

            let data = JSON.parse(s);

            this.loadItems(data, (name : string, path : string) => {
                this.loadBitmap(name, path);
            }, "bitmapPath", "bitmaps");

            this.loadItems(data, (name : string, path : string) => {
                this.loadTilemap(name, path);
            }, "tilemapPath", "tilemaps");

            this.loadItems(data, (name : string, path : string) => {
                this.loadSample(name, path);
            }, "samplePath", "samples");
        });
    }


    public hasLoaded = () : boolean => this.loaded >= this.totalAssets;


    public getBitmap(name : string) : Bitmap | undefined {

        return this.bitmaps.get(name);
    }


    public getSample(name : string) : Sample | undefined {

        return this.samples.get(name);
    }


    public getTilemap(name : string) : Tilemap | undefined {

        return this.tilemaps.get(name);
    }

}
