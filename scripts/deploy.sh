#!/bin/bash

rsync -avz --no-perms --no-owner --no-group --delete \
    --exclude-from=.rsync-filter \
    ./ sdriver@samdriver.xyz:/home/sdriver/samdriver.xyz/
