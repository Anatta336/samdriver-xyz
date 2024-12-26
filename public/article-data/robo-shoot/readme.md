# Flight Prototype

## Building
Best way to run is start up the whole netdev.samdriver.xyz site locally.

### First-time install
```
docker-compose run --rm npm install
```

### Build assets
```
docker-compose run --rm npm run watch
```

## Code Style
Makes heavy use of the "module pattern", for example:

```javascript
// store.js
export default () => {
    let somethingPrivate = 123;

    return {
        getValue,
    };

    function getValue() {
        return somethingPrivate * 2;
    }
}
```

```javascript
import createStore from './store.js';

const store = createStore();
console.log(store.getValue());
```

## TODO
- Box sliding around
- IK of a limb
- Box stepping around
- Gun shooting
- Enemy existing
- Enemy vs bullet detection
- Enemy vs player detection
- Enemy movement
- Some kind of level geometry
- Pathfinding


## Ideas
- Shop as web page to show 3D in a traditional setting
- Water puddles on map to have waves.
- "Simple" procedural stepping animation. Needs IK presumably?
- Djikstra map pathfinding for enemies, with some spread effect built in to it?
    - Each enemy overlaying a negative weighting to nearby cells.


