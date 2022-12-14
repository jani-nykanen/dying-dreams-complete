

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
    
        if (res.a < 1.0/255.0) {
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
    
        if (alpha < 1.0/255.0) {
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


    TexturedWaves : 
    
    `
    precision mediump float;
         
    uniform sampler2D texSampler;
    
    uniform vec4 color;
    
    uniform vec2 texPos;
    uniform vec2 texScale;
    
    uniform float period;
    uniform float amplitude;
    uniform float wave;

    varying vec2 uv;
    
    
    void main() {
    
        float shift = sin(wave + period*uv.x) * amplitude;

        vec2 tex = vec2(uv.x, uv.y + shift) * texScale + texPos;    
        vec4 res = texture2D(texSampler, tex) * color;
    
        if (res.a <= 1.0/255.0) {
             discard;
        }
        gl_FragColor = res;
    }`,
    
};
