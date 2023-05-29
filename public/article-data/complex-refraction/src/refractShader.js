/**
 * 
 */
const RefractShader = {

    uniforms: {

        'envMap' : { value: null },
        'refactiveIndexOutside': { value: 1.0 },
        'refactiveIndexInside': { value: 1.5 },

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
        uniform float refractiveIndexOutside;
        uniform float refractiveIndexInside;

        varying vec2 vUv;
        varying vec4 vWorldPosition;
        varying vec3 vObjectNormal;
        varying vec3 vWorldNormal;

        // Will return (0,0,0) in case of total internal reflection.
        vec3 applyRefraction(vec3 incoming, vec3 surfaceNormal, float indexA, float indexB) {

            // In reality refractive index should never be less than 1, but just in case.
            float ratio = abs(indexB) < 0.001
                ? 1000.0
                : indexA / indexB;

            return refract(incoming, surfaceNormal, ratio);
        }

        // approximation of the Fresnel equation for reflectance traveling from medium A to B.
        // based on https://graphics.stanford.edu/courses/cs148-10-summer/docs/2006--degreve--reflection_refraction.pdf
        float schlickApproximation(vec3 incoming, vec3 surfaceNormal, float indexA, float indexB) {

            float cosX = abs(dot(surfaceNormal, incoming))
            if (abs(cosX) < 0.001) {
                // Incoming ray is skimming the surface, so just reflect.
                return 1.0;
            }

            if (indexA > indexB) {
                float n = indexA / indexB;
                float sinT2 = n * n * (1.0 - cosX * cosX);

                if (sinT2 > 1.0)
                {
                    // Total internal reflection.
                    return 1.0;
                }

                cosX = sqrt(1.0 - sinT2);
            }

            float ratio = (indexA - indexB) / (indexA + indexB);
            float ratioSquared = ratio * ratio;
            float x = 1.0 - cosX;
            return ratioSquared + (1.0 - ratioSquared) * x*x*x*x*x;
        }

        void main() {
            vec3 cameraToSurface = normalize(vWorldPosition.xyz - cameraPosition);

            float surfaceReflectance = schlickApproximation(cameraToSurface, vWorldNormal, refractiveIndexOutside, refractiveIndexInside);

            vec3 surfaceReflectDirection = reflect(cameraToSurface, vWorldNormal);
            vec3 surfaceReflection = textureCube(envMap, surfaceReflectDirection).rgb;
            vec3 surfaceRefraction = vec3(0.0, 0.0, 0.0);

            gl_FragColor.rgba = vec4(mix(surfaceRefraction, surfaceReflection, surfaceReflectance), 1.0);
        }`
};

export { RefractShader };
