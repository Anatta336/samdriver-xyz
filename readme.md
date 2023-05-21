# Personal Site
Simple article site without a database.

## Running locally
Assuming a Windows machine using WSL and Docker.

`docker-compose up -d`

Add `127.0.0.1 netdev.samdriver.xyz` to your Windows hosts file.

Access site at `http://netdev.samdriver.xyz/`

## Publishing
Assuming you're me and have the appropriate RSA key.
```
rsync -e "ssh" -av --info=progress2 --exclude ".git" ~/code/samdriver.xyz/ sdriver@new.samdriver.xyz:/home/sdriver/samdriver.xyz
```

## Converting Images
Convert images to `webp` when possible.
```
for f in *.png; do cwebp -near_lossless 60 "$f" -o "${f%.png}.webp"; done
```

## TODO
- [ ] Auto-generate outline on side of article.
- [ ] Re-encode images as webp.
