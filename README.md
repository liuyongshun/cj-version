
### INSTALL

`npm install cj-version`

### USAGE

#### generate version table

```
command: cj-version check

command: cj-version check --h

command: cj-version check --field '["version", "engines", "homepage"]'

command: cj-version check --dir ./test/package.json

```

**params:**

|param|alias|default|des|
|:-----|:-----|:-----|:-----|
|--field  | --t | ["version", "homepage"]   |Package.json field |
|--dir   | --d | ./     |Directory of package.json |
|--h   | --h |     | help |
