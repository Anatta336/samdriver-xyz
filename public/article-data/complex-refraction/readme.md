# Complex Refraction
This documents describes building the content of the article. The article itself should exmplain what's going on in the code.

## Building
JavaScript for this article needs to be built, which is done using Rollup. Assuming you have Docker running locally:

Navigate to the article's directory (e.g. `public/article-data/complex-refraction/`)
```
docker-compose run --rm npm install && npm run build
```
Docker should set itself up, then npm will run inside the container and install dependencies.

```
docker-compose run --rm npm run build
```
npm will again run inside the container, and this time build the JavaScript dependencies.

There should now be a freshly updated `built.js` file, located at `public/article-data/complex-refraction/built.js`

### Rebuilding
If you're working on the article, you can set the JavaScript to automatically rebuild:
```
docker-compose run --rm npm run watch
```

### Why does this need building?
I try to avoid the added steps of building assets for these articles, but Three.js is deprecating support for use without a build tool. Importing the whole of a large library like that is often not a great idea anyway.

When viewing this code for learning, the parts you'll want to look at are in `public/article-data/complex-refraction/src/`.
