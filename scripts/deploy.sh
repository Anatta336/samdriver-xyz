#!/bin/bash

rsync -avz --no-perms --no-owner --no-group --delete -FF \
    --exclude-from=.rsync-filter \
    ./ sdriver@samdriver.xyz:/home/sdriver/samdriver.xyz/
