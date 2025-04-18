(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function s(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(t){if(t.ep)return;t.ep=!0;const r=s(t);fetch(t.href,r)}})();var G=`struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f,
}

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
    
    let pos = array(
        vec2f(-1.0, -1.0),  
        vec2f( 3.0, -1.0),  
        vec2f(-1.0,  3.0)   
    );

    let texCoords = array(
        vec2f(0.0, 0.0),  
        vec2f(2.0, 0.0),  
        vec2f(0.0, 2.0)   
    );

    var output: VertexOut;
    output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
    output.texCoord = texCoords[vertexIndex];
    return output;
}`,E=`struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,
    viscosity: f32,
    reserved:  f32,
}

const e = array<vec2<f32>, 9>(
    vec2<f32>(0.0, 0.0),   
    vec2<f32>(1.0, 0.0),   
    vec2<f32>(0.0, 1.0),   
    vec2<f32>(-1.0, 0.0),  
    vec2<f32>(0.0, -1.0),  
    vec2<f32>(1.0, 1.0),   
    vec2<f32>(-1.0, 1.0),  
    vec2<f32>(-1.0, -1.0), 
    vec2<f32>(1.0, -1.0)   
);

const w = array<f32, 9>(
    4.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0  
);

const opposite = array<u32, 9>(
    0u, 
    3u, 
    4u, 
    1u, 
    2u, 
    7u, 
    8u, 
    5u, 
    6u  
);

fn computeIndex(params: SimParams, x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

fn computeEquilibrium(rho: f32, velocity: vec2<f32>, i: u32) -> f32 {
    let vel_dot_e = dot(velocity, e[i]);
    let vel_squared = dot(velocity, velocity);

    
    
    return rho * w[i] * (
        1.0 +
        3.0 * vel_dot_e +
        4.5 * vel_dot_e * vel_dot_e -
        1.5 * vel_squared
    );
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;

fn velocityToColor(velocity: vec2<f32>) -> vec3<f32> {
    let speed = length(velocity);
    let maxSpeed = 0.1; 
    let normalizedSpeed = min(speed / maxSpeed, 1.0);

    
    let angle = atan2(velocity.y, velocity.x);
    let hue = (angle / (2.0 * 3.14159) + 1.0) * 0.5; 

    
    return hsv2rgb(vec3<f32>(hue, normalizedSpeed, normalizedSpeed * 0.8 + 0.2));
}

fn hsv2rgb(hsv: vec3<f32>) -> vec3<f32> {
    let h = hsv.x * 6.0;
    let s = hsv.y;
    let v = hsv.z;

    let c = v * s;
    let x = c * (1.0 - abs(fract(h) * 2.0 - 1.0));
    let m = v - c;

    var rgb: vec3<f32>;

    if (h < 1.0) {
        rgb = vec3<f32>(c, x, 0.0);
    } else if (h < 2.0) {
        rgb = vec3<f32>(x, c, 0.0);
    } else if (h < 3.0) {
        rgb = vec3<f32>(0.0, c, x);
    } else if (h < 4.0) {
        rgb = vec3<f32>(0.0, x, c);
    } else if (h < 5.0) {
        rgb = vec3<f32>(x, 0.0, c);
    } else {
        rgb = vec3<f32>(c, 0.0, x);
    }

    return rgb + vec3<f32>(m);
}

fn rgb2hsv(rgb: vec3<f32>) -> vec3<f32> {
    let maxVal = max(max(rgb.r, rgb.g), rgb.b);
    let minVal = min(min(rgb.r, rgb.g), rgb.b);
    let delta = maxVal - minVal;

    var h = 0.0;
    if delta == 0.0 {
        h = 0.0;
    } else if maxVal == rgb.r {
        h = ((rgb.g - rgb.b) / delta) % 6.0;
    } else if maxVal == rgb.g {
        h = (rgb.b - rgb.r) / delta + 2.0;
    } else {
        h = (rgb.r - rgb.g) / delta + 4.0;
    };

    var s = 0.0;
    if maxVal != 0.0 {
        s = delta / maxVal;
    }
    let v = maxVal;

    return vec3<f32>(h / 6.0, s, v);
}

@fragment
fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
    let x = u32(texCoord.x * f32(params.width));
    let y = u32((1.0 - texCoord.y) * f32(params.height));

    if (x >= params.width || y >= params.height) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    let baseIndex = computeIndex(params, x, y);

    
    let isBoundary = x == 0u || y == 0u || x == params.width - 1u || y == params.height - 1u;
    if (isBoundary) {
        return vec4f(0.2, 0.2, 0.2, 1.0); 
    }

    
    let rho = values[baseIndex + 9];

    
    
    

    
    let normalizedDensity = (rho - 0.9) * 5.0; 
    let densityFactor = clamp(normalizedDensity, 0.0, 1.0);

    
    let color = generateColour(densityFactor);
    return vec4<f32>(color, 1.0);
}

const PI: f32 = 3.14159;
const TWO_PI: f32 = 2.0 * PI;

fn generateColour(t: f32) -> vec3<f32> {
    let scaledT = t * 0.8 + 0.1;

    let pi = 3.14159;
    let constant = vec3<f32>(0.73, 0.81, 0.94);
    let multi    = vec3<f32>(0.96, 0.70, 0.75);
    let repeat   = vec3<f32>(1.00, 1.00, 0.00);
    let phase    = vec3<f32>(0.13, 0.93, 0.69);

    return constant + multi * cos(2 * pi * (scaledT * repeat + phase));
}

fn lerp_color(a: vec3<f32>, b: vec3<f32>, t: f32) -> vec3<f32> {
    let hsvA = rgb2hsv(a);
    let hsvB = rgb2hsv(b);

    
    let h = mix(hsvA.x, hsvB.x, t);
    let s = mix(hsvA.y, hsvB.y, t);
    let v = mix(hsvA.z, hsvB.z, t);

    return hsv2rgb(vec3<f32>(h, s, v));
}

fn density_to_color(density: f32) -> vec3<f32> {
    
    let c0 = vec3<f32>(0.116, 0.274, 0.500);
    let c1 = vec3<f32>(0.587, 0.471, 0.856);
    let c2 = vec3<f32>(0.876, 0.195, 0.892);

    return lerp_color(c2, c1, density);
}`;function U(e,n,s){const i=e.getDevice();if(!i)throw new Error("Trying to create pipeline when Renderer doesn't have device yet.");const t=i.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE|GPUShaderStage.FRAGMENT,buffer:{type:"storage"}}]}),r=i.createBindGroup({layout:t,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:s}}]}),o=i.createShaderModule({code:G}),u=i.createShaderModule({code:E}),a=i.createRenderPipeline({layout:i.createPipelineLayout({bindGroupLayouts:[t]}),vertex:{module:o,entryPoint:"main"},fragment:{module:u,entryPoint:"main",targets:[{format:e.getOutputTargetFormat()}]},primitive:{topology:"triangle-list"}}),d={renderer:e,bindGroup:r,pipeline:a};return{run:(l,c)=>C(l,d)}}function C(e,n){const s=n.renderer.getTextureView(),i=e.beginRenderPass({colorAttachments:[{view:s,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});i.setPipeline(n.pipeline),i.setBindGroup(0,n.bindGroup),i.draw(3,1,0,0),i.end()}var V=`struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,
    viscosity: f32,
    reserved:  f32,
}

const e = array<vec2<f32>, 9>(
    vec2<f32>(0.0, 0.0),   
    vec2<f32>(1.0, 0.0),   
    vec2<f32>(0.0, 1.0),   
    vec2<f32>(-1.0, 0.0),  
    vec2<f32>(0.0, -1.0),  
    vec2<f32>(1.0, 1.0),   
    vec2<f32>(-1.0, 1.0),  
    vec2<f32>(-1.0, -1.0), 
    vec2<f32>(1.0, -1.0)   
);

const w = array<f32, 9>(
    4.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0  
);

const opposite = array<u32, 9>(
    0u, 
    3u, 
    4u, 
    1u, 
    2u, 
    7u, 
    8u, 
    5u, 
    6u  
);

fn computeIndex(params: SimParams, x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

fn computeEquilibrium(rho: f32, velocity: vec2<f32>, i: u32) -> f32 {
    let vel_dot_e = dot(velocity, e[i]);
    let vel_squared = dot(velocity, velocity);

    
    
    return rho * w[i] * (
        1.0 +
        3.0 * vel_dot_e +
        4.5 * vel_dot_e * vel_dot_e -
        1.5 * vel_squared
    );
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;
@group(0) @binding(2) var<storage, read_write> userInput: array<f32>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let index = y * params.width + x;
    let baseIndex = computeIndex(params, x, y);

    
    let inputValue = userInput[index];

    
    if (inputValue > 0.0) {
        
        let rho = values[baseIndex + 9];
        let vx = values[baseIndex + 10];
        let vy = values[baseIndex + 11];

        
        let newRho = rho + inputValue * 0.2;
        let velocity = vec2<f32>(vx, vy);

        values[baseIndex + 9] = newRho;

        
        
        for (var i = 0u; i < 9u; i++) {
            values[baseIndex + i] = computeEquilibrium(newRho, velocity, i);
        }
    }

    
    userInput[index] = 0.0;
}`;function M(e,n,s){const i=e.getDevice();if(!i)throw new Error("Trying to create pipeline when Renderer doesn't have device yet.");const[t,r]=e.getResolution(),o=i.createBuffer({size:t*r*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),u=i.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),a=i.createBindGroup({layout:u,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:s}},{binding:2,resource:{buffer:o}}]}),d=i.createShaderModule({code:V}),l=i.createComputePipeline({layout:i.createPipelineLayout({bindGroupLayouts:[u]}),compute:{module:d,entryPoint:"main"}}),c={userInputBuffer:o,bindGroup:a,pipeline:l};return{run:(f,g)=>q(f,c,e),drawCircle:(f,g,h,m)=>T(e,c.userInputBuffer,f,g,h,m)}}function q(e,n,s){const[i,t]=s.getResolution(),r=e.beginComputePass();r.setPipeline(n.pipeline),r.setBindGroup(0,n.bindGroup),r.dispatchWorkgroups(Math.ceil(i/16),Math.ceil(t/16)),r.end()}function T(e,n,s,i,t,r){const[o,u]=e.getResolution(),a=new Float32Array(o*u),d=t*t;for(let l=-t;l<=t;l++){const c=Math.round(i+l);if(!(c<0||c>=u))for(let f=-t;f<=t;f++){const g=Math.round(s+f);if(g<0||g>=o)continue;if(f*f+l*l<=d){const m=c*o+g;a[m]=r}}}e.getQueue().writeBuffer(n,0,a)}function O(e){const n=e.getDevice();if(!n)throw new Error("Trying to create pipeline when Renderer doesn't have device yet.");const s=n.createBuffer({size:6*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i={simParamsBuffer:s,timeElapsed:0,renderer:e,viscosity:.1};return{run:(t,r)=>R(i,r),getSimParamsBuffer:()=>s,setViscosity:t=>{i.viscosity=t}}}function R(e,n){const s=e.renderer.getQueue(),[i,t]=e.renderer.getResolution();e.timeElapsed=e.timeElapsed+n;const r=new ArrayBuffer(6*4),o=new Uint32Array(r,0,2),u=new Float32Array(r,2*4,4);o[0]=i,o[1]=t;const a=1/(3*e.viscosity+.5);u[0]=e.timeElapsed,u[1]=a,u[2]=e.viscosity,u[3]=0,s.writeBuffer(e.simParamsBuffer,0,r)}var L=`struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,
    viscosity: f32,
    reserved:  f32,
}

const e = array<vec2<f32>, 9>(
    vec2<f32>(0.0, 0.0),   
    vec2<f32>(1.0, 0.0),   
    vec2<f32>(0.0, 1.0),   
    vec2<f32>(-1.0, 0.0),  
    vec2<f32>(0.0, -1.0),  
    vec2<f32>(1.0, 1.0),   
    vec2<f32>(-1.0, 1.0),  
    vec2<f32>(-1.0, -1.0), 
    vec2<f32>(1.0, -1.0)   
);

const w = array<f32, 9>(
    4.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0  
);

const opposite = array<u32, 9>(
    0u, 
    3u, 
    4u, 
    1u, 
    2u, 
    7u, 
    8u, 
    5u, 
    6u  
);

fn computeIndex(params: SimParams, x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

fn computeEquilibrium(rho: f32, velocity: vec2<f32>, i: u32) -> f32 {
    let vel_dot_e = dot(velocity, e[i]);
    let vel_squared = dot(velocity, velocity);

    
    
    return rho * w[i] * (
        1.0 +
        3.0 * vel_dot_e +
        4.5 * vel_dot_e * vel_dot_e -
        1.5 * vel_squared
    );
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read> src: array<f32>;
@group(0) @binding(2) var<storage, read_write> dst: array<f32>;

fn isSolid(x: u32, y: u32) -> bool {
    
    return x == 0u || y == 0u || x == params.width - 1u || y == params.height - 1u;

    
}

@compute @workgroup_size(16, 16)
fn collision(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let baseIndex = computeIndex(params, x, y);

    
    if (isSolid(x, y)) {
        
        
        for (var i = 0u; i < 12u; i++) {
            dst[baseIndex + i] = src[baseIndex + i];
        }
        return;
    }

    
    var f: array<f32, 9>;
    for (var i = 0u; i < 9u; i++) {
        f[i] = src[baseIndex + i];
    }

    
    var rho = 0.0;
    var momentum = vec2<f32>(0.0, 0.0);

    for (var i = 0u; i < 9u; i++) {
        rho += f[i];
        momentum += f[i] * e[i];
    }

    let velocity = select(momentum / rho, vec2<f32>(0.0, 0.0), rho < 0.0001);

    
    dst[baseIndex + 9] = rho;
    dst[baseIndex + 10] = velocity.x;
    dst[baseIndex + 11] = velocity.y;

    
    var f_eq: array<f32, 9>;
    for (var i = 0u; i < 9u; i++) {
        f_eq[i] = computeEquilibrium(rho, velocity, i);
    }

    
    
    for (var i = 0u; i < 9u; i++) {
        
        let f_coll = f[i] + params.omega * (f_eq[i] - f[i]);
        dst[baseIndex + i] = f_coll;
    }
}

@compute @workgroup_size(16, 16)
fn streaming(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let dstIndex = computeIndex(params, x, y);

    
    if (isSolid(x, y)) {
        
        
        for (var i = 1u; i < 9u; i++) { 
            let oppositeDir = opposite[i];

            
            let srcValue = src[dstIndex + i];

            
            dst[dstIndex + oppositeDir] = srcValue;
        }
        return;
    }

    
    for (var i = 0u; i < 9u; i++) {
        
        let srcDir = opposite[i];
        let srcVec = e[srcDir];

        
        let srcX = u32(i32(x) - i32(srcVec.x));
        let srcY = u32(i32(y) - i32(srcVec.y));

        
        if (srcX < params.width && srcY < params.height) {
            let srcCellIndex = computeIndex(params, srcX, srcY);

            
            if (isSolid(srcX, srcY)) {
                
                dst[dstIndex + i] = src[dstIndex + srcDir];
            } else {
                
                dst[dstIndex + i] = src[srcCellIndex + i];
            }
        }
    }

    
    dst[dstIndex + 9] = src[dstIndex + 9];   
    dst[dstIndex + 10] = src[dstIndex + 10]; 
    dst[dstIndex + 11] = src[dstIndex + 11]; 
}`;function Y(e,n){const s=e.getDevice(),[i,t]=e.getResolution();if(!s)throw new Error("Trying to create pipeline when Renderer doesn't have device yet.");const r=12*4,o=s.createBuffer({size:i*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),u=s.createBuffer({size:i*t*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),a=new Float32Array(i*t*12);for(let P=0;P<i*t;P++){const p=P*12;a[p+0]=4/9,a[p+1]=1/9,a[p+2]=1/9,a[p+3]=1/9,a[p+4]=1/9,a[p+5]=1/36,a[p+6]=1/36,a[p+7]=1/36,a[p+8]=1/36,a[p+9]=1,a[p+10]=0,a[p+11]=0}e.getQueue().writeBuffer(o,0,a),e.getQueue().writeBuffer(u,0,a);const d=s.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),l=s.createBindGroup({layout:d,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:o}},{binding:2,resource:{buffer:u}}]}),c=s.createBindGroup({layout:d,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:u}},{binding:2,resource:{buffer:o}}]}),f=s.createShaderModule({code:L}),g=s.createComputePipeline({layout:s.createPipelineLayout({bindGroupLayouts:[d]}),compute:{module:f,entryPoint:"collision"}}),h=s.createComputePipeline({layout:s.createPipelineLayout({bindGroupLayouts:[d]}),compute:{module:f,entryPoint:"streaming"}}),m={renderer:e,fluidBuffers:{src:o,dst:u},bindGroups:{collisionGroup:l,streamingGroup:c},pipelines:{collisionPipeline:g,streamingPipeline:h},timeElapsed:0,initialData:a};return{run:(P,p)=>A(P,m,p),getValuesBuffer:()=>m.fluidBuffers.src,resetSimulation:()=>D(m)}}function A(e,n,s){const[i,t]=n.renderer.getResolution();n.timeElapsed+=s;let r=e.beginComputePass();r.setPipeline(n.pipelines.collisionPipeline),r.setBindGroup(0,n.bindGroups.collisionGroup),r.dispatchWorkgroups(Math.ceil(i/16),Math.ceil(t/16)),r.end();let o=e.beginComputePass();o.setPipeline(n.pipelines.streamingPipeline),o.setBindGroup(0,n.bindGroups.streamingGroup),o.dispatchWorkgroups(Math.ceil(i/16),Math.ceil(t/16)),o.end()}function D(e){const n=e.renderer.getQueue();if(!n)throw new Error("Trying to reset simulation when Renderer doesn't have queue yet.");n.writeBuffer(e.fluidBuffers.src,0,e.initialData),n.writeBuffer(e.fluidBuffers.dst,0,e.initialData),e.timeElapsed=0}var z=`struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,
    viscosity: f32,
    reserved:  f32,
}

const e = array<vec2<f32>, 9>(
    vec2<f32>(0.0, 0.0),   
    vec2<f32>(1.0, 0.0),   
    vec2<f32>(0.0, 1.0),   
    vec2<f32>(-1.0, 0.0),  
    vec2<f32>(0.0, -1.0),  
    vec2<f32>(1.0, 1.0),   
    vec2<f32>(-1.0, 1.0),  
    vec2<f32>(-1.0, -1.0), 
    vec2<f32>(1.0, -1.0)   
);

const w = array<f32, 9>(
    4.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 9.0,  
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0, 
    1.0 / 36.0  
);

const opposite = array<u32, 9>(
    0u, 
    3u, 
    4u, 
    1u, 
    2u, 
    7u, 
    8u, 
    5u, 
    6u  
);

fn computeIndex(params: SimParams, x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

fn computeEquilibrium(rho: f32, velocity: vec2<f32>, i: u32) -> f32 {
    let vel_dot_e = dot(velocity, e[i]);
    let vel_squared = dot(velocity, velocity);

    
    
    return rho * w[i] * (
        1.0 +
        3.0 * vel_dot_e +
        4.5 * vel_dot_e * vel_dot_e -
        1.5 * vel_squared
    );
}

struct VelocityInput {
    startX: f32,
    startY: f32,
    endX: f32,
    endY: f32,
    strength: f32,
    radius: f32,
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;
@group(0) @binding(2) var<uniform> velocityInput: VelocityInput;

fn distToSegment(p: vec2<f32>, start: vec2<f32>, end: vec2<f32>) -> f32 {
    let line = end - start;
    let len_squared = dot(line, line);

    
    if (len_squared < 0.0001) {
        return distance(p, start);
    }

    
    let t = max(0.0, min(1.0, dot(p - start, line) / len_squared));
    let projection = start + t * line;

    
    return distance(p, projection);
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let baseIndex = computeIndex(params, x, y);

    
    let pos = vec2<f32>(f32(x) + 0.5, f32(y) + 0.5);

    
    let start = vec2<f32>(velocityInput.startX, velocityInput.startY);
    let end = vec2<f32>(velocityInput.endX, velocityInput.endY);

    
    let dist = distToSegment(pos, start, end);

    
    if (dist <= velocityInput.radius) {
        
        let direction = normalize(end - start);

        
        let falloff = 1.0 - (dist / velocityInput.radius);
        let strength = velocityInput.strength * falloff * falloff;

        

        
        let rho = values[baseIndex + 9];
        let vx = values[baseIndex + 10];
        let vy = values[baseIndex + 11];

        
        let newVx = vx - direction.x * strength;
        let newVy = vy - direction.y * strength;

        
        let maxMagnitude = 0.3;
        let magnitude = sqrt(newVx * newVx + newVy * newVy);
        var newVelocity = vec2<f32>(newVx, newVy);

        if (magnitude > maxMagnitude) {
            newVelocity *= (maxMagnitude / magnitude);
        }

        
        values[baseIndex + 10] = newVelocity.x;
        values[baseIndex + 11] = newVelocity.y;

        
        for (var i = 0u; i < 9u; i++) {
            
            let eq = computeEquilibrium(rho, newVelocity, i);
            let current = values[baseIndex + i];
            values[baseIndex + i] = current * 0.7 + eq * 0.3;  
        }
    }
}`;function X(e,n,s){const i=e.getDevice();if(!i)throw new Error("Trying to create pipeline when Renderer doesn't have device yet.");const t=i.createBuffer({size:6*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),r=i.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]}),o=i.createBindGroup({layout:r,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:s}},{binding:2,resource:{buffer:t}}]}),u=i.createShaderModule({code:z}),a=i.createComputePipeline({layout:i.createPipelineLayout({bindGroupLayouts:[r]}),compute:{module:u,entryPoint:"main"}}),d={velocityInputBuffer:t,bindGroup:o,pipeline:a,lastPosition:null,currentPosition:null};return{run:(l,c)=>F(l,d,e),recordMovement:(l,c)=>d.currentPosition={x:l,y:c}}}function F(e,n,s){var f,g,h,m;const[i,t]=s.getResolution(),r=s.getQueue(),o=(((f=n.currentPosition)==null?void 0:f.x)??0)-(((g=n.lastPosition)==null?void 0:g.x)??0),u=(((h=n.currentPosition)==null?void 0:h.y)??0)-(((m=n.lastPosition)==null?void 0:m.y)??0),a=Math.sqrt(o*o+u*u);if(!n.currentPosition||!n.lastPosition||a<1){n.lastPosition=n.currentPosition,n.currentPosition=null;return}const d=Math.min(a*.005,.6),l=new Float32Array(6);l[0]=n.lastPosition.x,l[1]=n.lastPosition.y,l[2]=n.currentPosition.x,l[3]=n.currentPosition.y,l[4]=d,l[5]=50,r.writeBuffer(n.velocityInputBuffer,0,l);const c=e.beginComputePass();c.setPipeline(n.pipeline),c.setBindGroup(0,n.bindGroup),c.dispatchWorkgroups(Math.ceil(i/16),Math.ceil(t/16)),c.end(),e.clearBuffer(n.velocityInputBuffer),n.lastPosition=n.currentPosition,n.currentPosition=null}async function N(e,n=256,s=256,i="bgra8unorm"){const t=await W(e,n,s,i);return{getCanvas:()=>t.canvas,getDevice:()=>t.device,getQueue:()=>t.queue,getTextureView:()=>t.context.getCurrentTexture().createView(),getOutputTargetFormat:()=>t.outputTargetFormat,addPipeline:o=>{t.pipelines.includes(o)||t.pipelines.push(o)},addPipelines:o=>{for(const u of o)t.pipelines.includes(u)||t.pipelines.push(u)},removePipeline:o=>{const u=t.pipelines.indexOf(o);u!==-1&&t.pipelines.splice(u,1)},getResolution:()=>[t.resolutionX,t.resolutionY],render:o=>k(t,o)}}async function W(e,n=256,s=256,i="bgra8unorm"){const t=navigator.gpu;if(!t)throw console.error("WebGPU is not supported"),new Error("WebGPU is not supported");const o=await(await t.requestAdapter()).requestDevice(),u=e.getContext("webgpu");if(!u)throw new Error("Failed to get WebGPU context.");const a={device:o,format:i,usage:GPUTextureUsage.RENDER_ATTACHMENT,alphaMode:"premultiplied"};return u.configure(a),{resolutionX:n,resolutionY:s,outputTargetFormat:i,canvas:e,device:o,queue:o.queue,context:u,pipelines:[],time:0}}function k(e,n){if(!e.device||!e.context||!e.queue){console.error("Renderer not fully initialized.");return}const s=e.device.createCommandEncoder();for(const i of e.pipelines)i.run(s,n);e.queue.submit([s.finish()])}const y=document.getElementById("gfx"),Q=document.getElementById("reset"),S=document.getElementById("viscosity-slider"),$=document.getElementById("viscosity-value");let v=null,b=null,x=null,w=null,_=null,I=null;j();async function j(){if(v=await N(y,500,500),!v){console.error("Failed to create renderer");return}b=O(v),x=Y(v,b.getSimParamsBuffer()),w=M(v,b.getSimParamsBuffer(),x.getValuesBuffer()),_=X(v,b.getSimParamsBuffer(),x.getValuesBuffer()),I=U(v,b.getSimParamsBuffer(),x.getValuesBuffer()),v.addPipelines([b,x,w,_,I]),y.addEventListener("click",K),y.addEventListener("mousemove",J),Q.addEventListener("click",()=>{x&&(x.resetSimulation(),console.log("Simulation reset"))}),S.addEventListener("input",H),requestAnimationFrame(B)}function H(){if(!b)return;const e=parseFloat(S.value);b.setViscosity(e),$.textContent=e.toFixed(3)}function K(e){if(!w||!v){console.warn("Click before initialization is complete");return}const n=y.getBoundingClientRect(),s=e.clientX-n.left,i=e.clientY-n.top,[t,r]=v.getResolution(),o=Math.round(s/y.width*t),u=Math.round(i/y.height*r);w.drawCircle(o,u,20.5,1)}function J(e){if(!_||!v)return;const n=y.getBoundingClientRect(),s=e.clientX-n.left,i=e.clientY-n.top,[t,r]=v.getResolution(),o=s/y.width*t,u=i/y.height*r;_.recordMovement(o,u)}function B(){if(!v)return;v.render(.016),requestAnimationFrame(B)}
