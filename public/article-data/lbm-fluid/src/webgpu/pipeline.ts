export default interface Pipeline {
    run(commandEncoder: GPUCommandEncoder): void;
}