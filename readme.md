# Personal Site
Simple article site without a database.

## Running locally
Assuming a Windows machine using WSL and Docker.

`docker-compose up -d`

Add `127.0.0.1 netdev.samdriver.xyz` to your Windows hosts file.

Access site at `http://netdev.samdriver.xyz/`

## Deploying
Assuming you're me and have the appropriate RSA key.
```
rsync -e \"ssh\" -av --info=progress2 --delete --exclude=\".git\" --exclude=\"vendor\" ~/code/samdriver.xyz/ sdriver@new.samdriver.xyz:/home/sdriver/samdriver.xyz
```

Or if using VS Code, run the `sync-live` task.

## Converting Images
Convert images to `webp` when possible. This will work well in the majority of cases. Consider switching `-near_lossless 60` for `-q 80` (or similar) if dealing with photos. If images have important colour information encoded along with alpha (e.g. a 4 channel texture) add the `-exact` option.
```
for f in *.png; do cwebp -near_lossless 60 "$f" -o "${f%.png}.webp"; done
```

## Dependencies
This project intentionally has no dependencies for the live version other than PHP itself.

It does have development dependencies for automated tests. These are *not* required for the project to function, and do not need to be present on a live server.

## Testing
```
docker-compose run --rm phpunit tests/
```

Currently the project uses a different autoloader for testing than it does for live. The testing autoloader is provided by Composer, while the "real" autoloader is found at `./app/autoloader.php`.

## TODO
- [ ] Auto-generate outline on side of articles.
- [ ] Update Docker version to use Apache, to match server.
