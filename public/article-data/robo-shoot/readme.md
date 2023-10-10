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
- [ ]

## Ideas

