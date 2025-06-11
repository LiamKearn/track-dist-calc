#!/usr/bin/env sh

LAST=""
while true; do
  H_HASH=$(md5 -q docs/index.html)
  J_HASH=$(md5 -q docs/index.js)
  [ "$H_HASH$J_HASH" != "$LAST" ] && echo "$H_HASH$J_HASH" > docs/reload && LAST="$H_HASH$J_HASH"
  sleep 1
done

