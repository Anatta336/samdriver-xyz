# Lattice Boltzman Method fluid simulation using WebGPU

## Running locally
Built using npm version 10.9.1, node v22.11.0. Anything similar is likely to work.

```sh
npm install
npm run dev
```

## Notes
- Is the fluid simulation behaving itself? Results from injecting velocity seem odd.
- Add advecting dye. May also provide useful debug information.
- Handle context loss (or equivalent for WebGPU), see if structure needs changing to better recover.

## References
https://surma.dev/things/webgpu/
