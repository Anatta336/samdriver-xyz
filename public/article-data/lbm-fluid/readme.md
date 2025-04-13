# Lattice Boltzman Method fluid simulation using WebGPU

## Running locally
Built using npm version 10.9.1, node v22.11.0. Anything similar is likely to work.

```sh
npm install
npm run dev
```

## Notes
- Pull the pipelines out of `renderer`. No need to make some totally generic thing, but also piling up too much stuff in there.

