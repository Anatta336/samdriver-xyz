import { Quaternion, Vector3 } from "three";

export default () => {

    /**
     * @type {Vector3} Velocity of this lifing surface.
     */
    const absoluteVelocity = new Vector3();

    /**
     * @type {Quaternion} Facing of this lifting surface, relative to the world.
     *                    Identity means facing down the positive X axis.
     */
    const rotation = new Quaternion();

    /**
     * @param {Vector3} windAbsoluteVelocity
     *
     * @return {number}
     */
    function calculateLift(windAbsoluteVelocity) {

    }

    /**
     * Gives a scalar representation of how much air is passing over the lifting surface.
     *
     *
     * @return {number}
     */
    function calculateFrontIncoming() {

    }
};
