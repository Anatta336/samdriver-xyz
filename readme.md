# Personal Site

Simple article site without a database.

## Running locally
Assuming a Windows machine, possibly using WSL, with Docker installed.

`docker-compose up -d`

Add `127.0.0.1 netdev.samdriver.xyz` to your Windows hosts file.

Access site at `http://netdev.samdriver.xyz/`

## Publishing
```
rsync -e "ssh" -av --info=progress2 --exclude ".git" ~/code/samdriver.xyz/ sdriver@new.samdriver.xyz:/home/sdriver/samdriver.xyz
```

## TODO
[ ] Auto-generate outline on side of article.
[ ] Re-encode images as webp.
