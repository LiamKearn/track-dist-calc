#!/usr/bin/env sh

LAST=""
while true; do
  H_HASH=$(md5 -q docs/index.html)
  J_HASH=$(md5 -q docs/index.js)
  T_HASH=$(md5 -q docs/trackviz.js)
  ALL_HASH="$H_HASH$J_HASH$T_HASH"
  [ "$ALL_HASH" != "$LAST" ] && echo "$ALL_HASH" > docs/reload && LAST="$ALL_HASH"
  sleep 1
done

