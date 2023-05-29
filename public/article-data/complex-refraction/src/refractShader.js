/**
 * 
 */
const RefractShader = {

    uniforms: {

        'envMap' : { value: null },
        'refractiveRatio': { value: 1.0 }

    },

    vertexShader: /* glsl */`

        varying vec2 vUv;
        varying vec4 vWorldPosition;
        varying vec3 vObjectNormal;
        varying vec3 vWorldNormal;

        void main() {
            vUv = uv;

            vWorldPosition = modelMatrix * vec4(position, 1.0);

            vObjectNormal = normal;

            // Setting .w to 0 treats the vector as a direction.
            vWorldNormal = (modelMatrix * vec4(normal.xyz, 0.0)).xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,

    fragmentShader: /* glsl */`

        uniform samplerCube envMap;
        uniform float refractiveRatio;

        varying vec2 vUv;
        varying vec4 vWorldPosition;
        varying vec3 vObjectNormal;
        varying vec3 vWorldNormal;

        void main() {
            vec3 cameraToSurface = normalize(vWorldPosition.xyz - cameraPosition);
            // vec3 directionToSample = normalize(refract(cameraToSurface, vWorldNormal, refractiveRatio));
            vec3 directionToSample = normalize(reflect(cameraToSurface, vWorldNormal));

            gl_FragColor.rgba = vec4(
                textureCube(envMap, directionToSample).rgb,
                1.0
            );
        }`
};

export { RefractShader };