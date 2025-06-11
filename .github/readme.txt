TO DEVELOP
- `./watch.sh &`
- `php -S localhost:8000 &` or `python -m http.server 8000 &`
- `tsc -w`
Should hotreload, might want to run tsc in a different terminal or deal with watch/php serve output.
eg. `php -S localhost:8000 >/dev/null 2>&1 &`
