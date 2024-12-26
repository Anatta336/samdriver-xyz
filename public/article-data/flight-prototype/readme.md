# Flight Prototype

## Building
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
- [x] Render land plane
- [x] Render player box
- [x] Rotate box from input
- [x] Move with no physics
- [ ] Simplest flight physics
- [ ] 1st pass camera control
- [ ] Display absolute speed and altitude
- [ ] Button to cheat for height when testing
- [ ] Wind
- [ ] 2nd pass on physics
- [ ] Anchor
- [ ] Non-flat landscape
- [ ] Player model
- [ ] Pretty sky
- [ ] Clouds

## Ideas
### Control
- Left stick bank and pitch.
- Triggers rudder.
- Air brake on a button somewhere.
- Tuck wings to allow greater top speed at loss of lift.

### Reel-in
Control length of anchor line using right stick rotation.

## Structure
- Don't make an over-engineered thing.

- Land and player should each be a Mesh from three.js.

- Startup order:
    - Create Three renderer.
    - Prepare and add player, landscape.
    - Detect when all ready.
    - Start loop.
