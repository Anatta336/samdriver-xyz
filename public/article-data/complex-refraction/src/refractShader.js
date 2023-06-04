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
        'aabbExterior': { value: new Vector3(0.07, 0.09, 0.03) },
        'aabbInterior': { value: new Vector3(0.06, 0.08, 0.02) },
        'absorbanceCoefficient': { value: 0.5 },
        'absorbanceColour': { value: new Vector3(1.0, 1.0, 0.2) },
    },

    vertexShader: /* glsl */`

        varying vec3 vObjectPosition;
        varying vec3 vObjectCameraPosition;
        varying mat4 vModelMatrix;

        void main() {
            vObjectPosition = position;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(vObjectPosition.xyz, 1.0);

            vObjectCameraPosition = (vec4(cameraPosition.xyz, 1.0) * modelMatrix).xyz;

            vModelMatrix = modelMatrix;
        }`,

    fragmentShader: /* glsl */`

        uniform samplerCube environmentSampler;
        uniform samplerCube interiorSampler;
        uniform samplerCube exteriorSampler;

        uniform float refractiveIndexOutside;
        uniform float refractiveIndexInside;
        uniform vec3 aabbExterior;
        uniform vec3 aabbInterior;
        uniform float absorbanceCoefficient;
        uniform vec3 absorbanceColour;

        varying vec3 vObjectPosition;
        varying vec3 vObjectCameraPosition;
        varying mat4 vModelMatrix;

        vec3 safeDivision(in vec3 a, in vec3 b) {
            // Avoid divide by zero.
            b.x = abs(b.x) < 0.000001 ? (b.x >= 0.0 ? b.x = 0.000001 : b.x = -0.000001) : b.x;
            b.y = abs(b.y) < 0.000001 ? (b.y >= 0.0 ? b.y = 0.000001 : b.y = -0.000001) : b.y;
            b.z = abs(b.z) < 0.000001 ? (b.z >= 0.0 ? b.z = 0.000001 : b.z = -0.000001) : b.z;

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

        float max4(in float a, in float b, in float c, in float d) {
            return max(max(a, b), max(c, d));
        }

        float min4(in float a, in float b, in float c, in float d) {
            return min(min(a, b), min(c, d));
        }

        // tIntersect -1.0 if no intersection, otherwise the distance along the ray to the intersection.
        void aabbIntersection(in vec3 rayDirection, in vec3 rayPosition,
            in vec3 aabbMin, in vec3 aabbMax,
            out float tIntersect
        ) {
            vec3 t1 = safeDivision(aabbMin - rayPosition, rayDirection);
            vec3 t2 = safeDivision(aabbMax - rayPosition, rayDirection);

            float minOffset = 0.00001;

            float tMin = max4(minOffset, min(t1.x, t2.x), min(t1.y, t2.y), min(t1.z, t2.z));
            float tMax = min4(1e12, max(t1.x, t2.x), max(t1.y, t2.y), max(t1.z, t2.z));

            if (tMin <= minOffset && tMax > tMin) {
                // Ray starts inside the AABB.
                tIntersect = tMax;
            } else {
                // Ray starts outside the AABB.
                tIntersect = ((tMin <= minOffset) || (tMin > tMax))
                    ? -1.0
                    : tMin;
            }
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
            vec3 aabbInternalMin = aabbInterior * -0.5;
            vec3 aabbInternalMax = aabbInterior * 0.5;

            vec3 aabbExternalMin = aabbExterior * -0.5;
            vec3 aabbExternalMax = aabbExterior * 0.5;

            float totalDistance = 0.0;

            // Ray enters the mesh at A.
            vec3 aNormal = sampleNormal(vObjectPosition.xyz, exteriorSampler).xyz;
            vec3 aPosition = vObjectPosition.xyz;

            // Handle interface at A.
            vec3 aRefractDirection = vec3(0.0, 0.0, 0.0);
            vec3 aReflectDirection = vec3(0.0, 0.0, 0.0);
            float aReflectance = 0.0;
            castThroughInterface(normalize(aPosition - vObjectCameraPosition), aNormal,
                refractiveIndexOutside, refractiveIndexInside,
                aReflectDirection, aRefractDirection, aReflectance
            );

            // Some is immediately reflected back out of the mesh.
            vec3 aColourReflect = sampleEnvFromObjectDirection(aReflectDirection, vModelMatrix, environmentSampler);

            // aRefracted may enter interior volume, if so it's at B.
            float bDistance = 0.0;
            aabbIntersection(aRefractDirection, aPosition,
                aabbInternalMin, aabbInternalMax,
                bDistance
            );

            totalDistance += max(0.0, bDistance);

            vec3 bPosition = bDistance >= -0.5
                ? aPosition + aRefractDirection * bDistance
                : aPosition;

            vec3 beforeDPosition = vec3(0.0, 0.0, 0.0);
            vec3 dIncomingDirection = vec3(0.0, 0.0, 0.0);

            if (bDistance < -0.5) {

                // Ray doesn't enter interior volume, so skip to it leaving.
                beforeDPosition = aPosition;
                dIncomingDirection = aRefractDirection;

            } else {

                // Find the normal of the interior at the point where the ray enters interior.
                vec3 bNormal = sampleNormal(bPosition, interiorSampler).xyz;

                // TODO: around here is where we'd start handling liquid filling.

                // Find how the ray gets split when entering interior space.
                vec3 bRefractDirection = vec3(0.0, 0.0, 0.0);
                vec3 bReflectDirection = vec3(0.0, 0.0, 0.0);
                float bReflectance = 0.0;
                castThroughInterface(aRefractDirection, bNormal,
                    refractiveIndexInside, refractiveIndexOutside,
                    bReflectDirection, bRefractDirection, bReflectance
                );

                if (bReflectance >= 0.999) {

                    // Total internal reflection, so just follow reflection ray.
                    beforeDPosition = bPosition;
                    dIncomingDirection = bReflectDirection;

                } else {

                    // Find where the ray leaves the interior AABB.
                    float cDistance = 0.0;
                    aabbIntersection(bRefractDirection, bPosition,
                        aabbInternalMin, aabbInternalMax,
                        cDistance
                    );

                    // Don't add to totalDistance, as this is in the interior volume.

                    vec3 cPosition = (cDistance >= -0.5)
                        ? (bPosition + bRefractDirection * cDistance)
                        : bPosition;

                    // Find the normal of the interior at the point where the ray exits.
                    vec3 cNormal = sampleNormal(cPosition, interiorSampler).xyz;

                    // Dump cNormal (useful for demo)
                    // gl_FragColor = vec4((cNormal + 1.0) * 0.5, 1.0);
                    // return;

                    // Find how the ray gets split when leaving the interior space.
                    vec3 cRefractDirection = vec3(0.0, 0.0, 0.0);
                    vec3 cReflectDirection = vec3(0.0, 0.0, 0.0);
                    float cReflectance = 0.0;
                    castThroughInterface(bRefractDirection, cNormal * -1.0,
                        refractiveIndexOutside, refractiveIndexInside,
                        cReflectDirection, cRefractDirection, cReflectance
                    );

                    // Ignoring reflection here. Going from air to glass so this'll be minor.

                    dIncomingDirection = cRefractDirection;
                    beforeDPosition = cPosition;
                }
            }

            // Find where the ray exits the mesh.
            float dDistance = 0.0;
            aabbIntersection(dIncomingDirection, beforeDPosition,
                aabbExternalMin, aabbExternalMax,
                dDistance
            );

            totalDistance += max(0.0, dDistance);
            
            vec3 dPosition = (dDistance >= 0.0)
                ? (beforeDPosition + dIncomingDirection * dDistance)
                : beforeDPosition;

            vec3 dNormal = sampleNormal(dPosition, exteriorSampler).xyz;

            // Find how the refracted ray gets split when leaving the mesh.
            vec3 dRefractDirection = vec3(0.0, 0.0, 0.0);
            vec3 dReflectDirection = vec3(0.0, 0.0, 0.0);
            float dReflectance = 0.0;

            castThroughInterface(dIncomingDirection, dNormal * -1.0,
                refractiveIndexInside, refractiveIndexOutside,
                dReflectDirection, dRefractDirection, dReflectance
            );

            // Some is refracted out into the environment.
            vec3 exitRefraction = sampleEnvFromObjectDirection(dRefractDirection, vModelMatrix, environmentSampler);

            // Some is reflected back into the AABB.
            // We *should* follow this through the AABB again, but we'll have to stop tracking at some point.
            vec3 exitReflection = sampleEnvFromObjectDirection(dReflectDirection, vModelMatrix, environmentSampler);

            vec3 interiorColour = mix(exitRefraction, exitReflection, dReflectance);

            // Dump distance (useful for demo)
            // totalDistance *= 8.0;
            // gl_FragColor.rgba = vec4(totalDistance, totalDistance, totalDistance, 1.0);
            // return;

            interiorColour = max(
                vec3(0.0, 0.0, 0.0),
                interiorColour * exp(
                    -1.0 * totalDistance * absorbanceCoefficient * absorbanceColour
                )
            );

            gl_FragColor.rgba = vec4(mix(interiorColour, aColourReflect, aReflectance), 1.0);
        }`
};

export { RefractShader };
