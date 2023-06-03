import { Vector3 } from 'three';

/**
 * 
 */
const RefractShader = {

    uniforms: {
        'environmentSampler' : { value: null },
        'interiorSampler' : { value: null },
        'exteriorSampler' : { value: null },
        'refactiveIndexOutside': { value: 1.0 },
        'refactiveIndexInside': { value: 1.5 },
        'aabbExtent': { value: new Vector3(0.07, 0.09, 0.03) },
    },

    vertexShader: /* glsl */`

        varying vec2 vUv;
        varying vec3 vObjectPosition;
        varying vec3 vWorldPosition;
        varying vec3 vObjectNormal;
        varying vec3 vWorldNormal;
        varying vec3 vObjectCameraPosition;
        varying vec3 vWorldCameraPosition;
        varying mat4 vModelMatrix;

        void main() {
            vUv = uv;

            // .w to 1.0 treats the vector as a position.
            vWorldPosition = (modelMatrix * vec4(position.xyz, 1.0)).xyz;
            vObjectPosition = position;

            // Setting .w to 0 treats the vector as a direction.
            vWorldNormal = (modelMatrix * vec4(normal.xyz, 0.0)).xyz;
            vObjectNormal = normal;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(vObjectPosition.xyz, 1.0);

            vWorldCameraPosition = cameraPosition.xyz;
            vObjectCameraPosition = (vec4(vWorldCameraPosition.xyz, 1.0) * modelMatrix).xyz;

            vModelMatrix = modelMatrix;
        }`,

    fragmentShader: /* glsl */`

        uniform samplerCube environmentSampler;
        uniform samplerCube interiorSampler;
        uniform samplerCube exteriorSampler;

        uniform float refractiveIndexOutside;
        uniform float refractiveIndexInside;
        uniform vec3 aabbExtent;

        varying vec2 vUv;
        varying vec3 vObjectPosition;
        varying vec3 vWorldPosition;
        varying vec3 vObjectNormal;
        varying vec3 vWorldNormal;
        varying vec3 vObjectCameraPosition;
        varying vec3 vWorldCameraPosition;
        varying mat4 vModelMatrix;

        float smallestPositive(in vec3 a, in vec3 b) {
            // Ignore any negative values by setting them to be very large.
            a.x = a.x <= 0.0 ? 1e10 : a.x;
            a.y = a.y <= 0.0 ? 1e10 : a.y;
            a.z = a.z <= 0.0 ? 1e10 : a.z;
            b.x = b.x <= 0.0 ? 1e10 : b.x;
            b.y = b.y <= 0.0 ? 1e10 : b.y;
            b.z = b.z <= 0.0 ? 1e10 : b.z;

            vec3 c = min(a, b);
            return min(min(c.x, c.y), c.z);
        }

        vec3 safeDivision(in vec3 a, in vec3 b) {
            // Avoid divide by zero.
            b.x = abs(b.x) < 0.0001 ? (b.x > 0.0 ? b.x = 0.0001 : b.x = -0.001) : b.x;
            b.y = abs(b.y) < 0.0001 ? (b.y > 0.0 ? b.y = 0.0001 : b.y = -0.001) : b.y;
            b.z = abs(b.z) < 0.0001 ? (b.z > 0.0 ? b.z = 0.0001 : b.z = -0.001) : b.z;

            return a / b;
        }

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
            float cosX = abs(dot(surfaceNormal, incoming));
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

        void castThroughInterface(in vec3 incomingDirection, in vec3 surfaceNormal,
            in float indexA, in float indexB,
            out vec3 reflectDirection, out vec3 refractDirection, out float reflectance
        ) {
            reflectance = schlickApproximation(incomingDirection, surfaceNormal, indexA, indexB);
            reflectDirection = reflect(incomingDirection, surfaceNormal);
            refractDirection = refract(incomingDirection, surfaceNormal, indexA / indexB);
        }

        // Assuming ray starts inside the AABB, find where it exits.
        void castTraverseInsideAABB(in vec3 incomingDirection, in vec3 incomingPosition, in vec3 aabbExtent,
            out vec3 exitPosition, out float tExit
        ) {
            // AABB defined by extent.
            vec3 aabbExtentNegative = vec3(-aabbExtent.x * 0.5, -aabbExtent.y * 0.5, -aabbExtent.z * 0.5);
            vec3 aabbExtentPositive = vec3(aabbExtent.x * 0.5, aabbExtent.y * 0.5, aabbExtent.z * 0.5);

            // Move start position along a little to avoid z-fighting.
            incomingPosition += incomingDirection * 0.0001;

            // Each value in tInterceptA.xyz, tInterceptB.xyz is "when" the ray hits the AABB.
            // Negative values should be ignored, as that's in the wrong direction.
            tExit = smallestPositive(
                safeDivision((aabbExtentNegative - incomingPosition), incomingDirection),
                safeDivision((aabbExtentPositive - incomingPosition), incomingDirection)
            );

            exitPosition = incomingPosition + incomingDirection * tExit;
        }

        vec3 sampleEnvFromObjectDirection(in vec3 objectDirection, in mat4 modelMatrix, in samplerCube environmentSampler) {
            vec3 worldDirection = (modelMatrix * vec4(objectDirection.xyz, 0.0)).xyz;
            return textureCube(environmentSampler, worldDirection).rgb;
        }

        vec3 sampleNormal(in vec3 objectPosition, in samplerCube normalSampler) {
            vec3 raw = vec3(1.0) - textureCube(normalSampler, normalize(objectPosition)).rgb;
            vec3 normal = normalize(vec3(
                (raw.x - 0.5) * 2.0,
                (raw.y - 0.5) * 2.0,
                (raw.z - 0.5) * 2.0
            ));

            return normal;
        }

        void main() {
            vec3 surfaceObjectNormal = sampleNormal(vObjectPosition.xyz, exteriorSampler).xyz;
            vec3 surfaceObjectPosition = vObjectPosition.xyz;

            // Values to be filled by castThroughInterface.
            vec3 surfaceRefractObjectDirection = vec3(0.0, 0.0, 0.0);
            vec3 surfaceReflectObjectDirection = vec3(0.0, 0.0, 0.0);
            float surfaceReflectance = 0.0;
            castThroughInterface(normalize(surfaceObjectPosition - vObjectCameraPosition), surfaceObjectNormal,
                refractiveIndexOutside, refractiveIndexInside,
                surfaceReflectObjectDirection, surfaceRefractObjectDirection, surfaceReflectance
            );

            // Some light is immediately reflected out to environment from surface.
            vec3 surfaceReflection = sampleEnvFromObjectDirection(surfaceReflectObjectDirection, vModelMatrix, environmentSampler);

            // Find where the refracted ray exits the AABB.
            vec3 exitObjectPosition = vec3(0.0, 0.0, 0.0);
            float tExit = 0.0;
            castTraverseInsideAABB(
                surfaceRefractObjectDirection, surfaceObjectPosition, aabbExtent,
                exitObjectPosition, tExit
            );
            
            vec3 exitObjectNormal = sampleNormal(exitObjectPosition, exteriorSampler).xyz;

            // Find how the refracted ray gets split when hitting the exit of AABB.
            vec3 exitRefractObjectDirection = vec3(0.0, 0.0, 0.0);
            vec3 exitReflectObjectDirection = vec3(0.0, 0.0, 0.0);
            float exitReflectance = 0.0;
            castThroughInterface(surfaceRefractObjectDirection, exitObjectNormal * -1.0,
                refractiveIndexInside, refractiveIndexOutside,
                exitReflectObjectDirection, exitRefractObjectDirection, exitReflectance
            );

            // Some is refracted out into the environment.
            vec3 exitRefraction = sampleEnvFromObjectDirection(exitRefractObjectDirection, vModelMatrix, environmentSampler);

            // Some is reflected back into the AABB.
            // We *should* follow this through the AABB again, but we'll have to stop tracking at some point.
            vec3 exitReflection = sampleEnvFromObjectDirection(exitReflectObjectDirection, vModelMatrix, environmentSampler);

            vec3 interiorColour = mix(exitRefraction, exitReflection, exitReflectance);
            gl_FragColor.rgba = vec4(mix(interiorColour, surfaceReflection, surfaceReflectance), 1.0);
        }`
};

export { RefractShader };
