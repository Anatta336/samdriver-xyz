# Personal Site
Simple article site without a database.

## Running locally
Assuming a Windows machine using WSL and Docker.

```sh
docker-compose up -d
```

Add `127.0.0.1 netdev.samdriver.xyz` to your Windows hosts file.

Access site at `http://netdev.samdriver.xyz/`

## Deploying
Assuming you're me, or have stolen the appropriate private key.
```sh
. ./deploy.sh
```

## Converting Images
Convert images to `webp` when possible. This will work well in the majority of cases. Consider switching `-near_lossless 60` for `-q 80` (or similar) if dealing with photos. If images have important colour information encoded along with alpha (e.g. a 4 channel texture) add the `-exact` option.

```sh
for f in *.png; do cwebp -near_lossless 60 "$f" -o "${f%.png}.webp"; done
```

## Dependencies
The base site project intentionally has no dependencies for the live version other than PHP itself.

It does have development dependencies for automated tests. These are *not* required for the project to function, and do not need to be present on a live server.

Some pages are built using various JavaScript tools. Look for a `readme.md` in their directory within `public/article-data`.

## Testing
```sh
docker-compose run --rm phpunit tests/
```

Currently the project uses a different autoloader for testing than it does for live. The testing autoloader is provided by Composer, while the "real" autoloader is found at `./app/autoloader.php`.

## Article Specific Building
Some articles use build tools to prepare JavaScript, for example `complex-refraction`. If there are build steps required, there will also be a `readme.md` file explaining them.

## TODO
- [ ] Auto-generate outline on side of articles.
- [ ] Update Docker version to use Apache, to match server.
