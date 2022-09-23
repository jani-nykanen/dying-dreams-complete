

export const VertexSource = {

    Textured : 
        
    `
    attribute vec2 vertexPos;
    attribute vec2 vertexUV;
    
    uniform mat3 transform;
    
    uniform vec2 pos;
    uniform vec2 scale;
    
    varying vec2 uv;
    
    
    void main() {
    
        gl_Position = vec4(transform * vec3(vertexPos * scale + pos, 1), 1);
        uv = vertexUV;
    }`,
    
    NoTexture : 
        
    `
    attribute vec2 vertexPos;
    attribute vec2 vertexUV;
    
    uniform mat3 transform;
    
    uniform vec2 pos;
    uniform vec2 scale;

    
    void main() {
    
        gl_Position = vec4(transform * vec3(vertexPos * scale + pos, 1), 1);
    }`,


    TexturedCRT : 
        
    `
    attribute vec2 vertexPos;
    attribute vec2 vertexUV;
    
    uniform mat3 transform;
    
    uniform vec2 pos;
    uniform vec2 scale;
    
    varying vec2 uv;

    
    void main() {

        // TODO: Move to uniforms
        const float BUMP_FACTOR = 0.70;
        const float LEN_SHIFT = 1.5;
        const float POWER = 0.75;

        vec2 shift = vec2(0.0, 0.0);
        vec2 dir;

        // Aspect ratio correction
        vec2 p = vertexPos * vec2(1.0, scale.y / scale.x) * 2.0;

        float len = length(p) + LEN_SHIFT;
        float f = clamp(len / (sqrt(2.0) + LEN_SHIFT), 0.0, 1.0);
        float d = ( 1.0 - pow(f, POWER) ) * BUMP_FACTOR;
    
        shift = d * (p / len);
        
        gl_Position = vec4(transform * vec3((vertexPos + shift) * scale + pos, 1), 1);
        uv = vertexUV;
    }`,
    
    
};
    
    
export const FragmentSource = {
    
    Textured : 
    
    `
    precision mediump float;
         
    uniform sampler2D texSampler;
    
    uniform vec4 color;
    
    uniform vec2 texPos;
    uniform vec2 texScale;
    
    varying vec2 uv;
    
    
    void main() {
    
        vec2 tex = uv * texScale + texPos;    
        vec4 res = texture2D(texSampler, tex) * color;
    
        if (res.a <= 0.01) {
             discard;
        }
        gl_FragColor = res;
    }`,


    TexturedFixedColor : 
    
    `
    precision mediump float;
         
    uniform sampler2D texSampler;
    
    uniform vec4 color;
    
    uniform vec2 texPos;
    uniform vec2 texScale;
    
    varying vec2 uv;
    
    
    void main() {
    
        vec2 tex = uv * texScale + texPos;    
        float alpha = texture2D(texSampler, tex).a;
    
        if (alpha <= 0.01) {
             discard;
        }
        gl_FragColor = color;
    }`,
    
    
    NoTexture : 
    
    `
    precision mediump float;
    
    uniform vec4 color;
    
    
    void main() {
    
        gl_FragColor = color;
    }`,
    

    TexturedCRT : 
    
    `
    precision mediump float;
         
    uniform sampler2D texSampler;
    
    uniform vec4 color;
    
    uniform vec2 texPos;
    uniform vec2 texScale;

    uniform vec2 screenSize;

    varying vec2 uv;


    float compute_black_border_modifier() {

        // TODO: Move to uniforms
        const float MIN_DIST = 0.85;
        const float EXPONENT = 10.0;

        vec2 p = uv*2.0 - 1.0;
        
        // TODO: Optimize pow out of this if possible?
        float dist = pow( pow(abs(p.x), EXPONENT) + pow(abs(p.y), EXPONENT), 1.0/EXPONENT);
        return 1.0 - max(0.0, dist - MIN_DIST) / (1.0 - MIN_DIST);
    }

    
    void main() {

        // TODO: Add uniforms!
    
        vec2 tex = uv * texScale + texPos;    
        vec4 res = texture2D(texSampler, tex) * color;

        res += 0.15;
    
        vec2 p = uv * vec2(256.0, 192.0); // TEMP

        p.x = mod(p.x, 1.0);
        p.y = mod(p.y, 1.0);

        float d = 1.0 - min(1.0, max(abs(p.x - 0.5), abs(p.y - 0.5)) * 1.5);

        res.rgb *= sqrt(d);
        
        float black = compute_black_border_modifier();
        res.rgb *= sqrt(black);

        gl_FragColor = res;
    }`,
};
