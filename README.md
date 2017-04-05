# Elasticsearch Fixtures

Simple fixture loading for Elasticsearch on Node.js. Clean and load easily mock data in your Elasticsearch instance, useful for Unit Tests or other kind of testing.

# Features

- Compatible with callbacks and Promises
  - An optional callback will be called with the final result of the method. When omitted, a promise is returned
  - Native Promises usage
- ES6 usage
- The only dependencies are [minimist](https://github.com/substack/minimist) for the CLI and the official [Elasticsearch javascript driver](https://github.com/elastic/elasticsearch-js)
- Tested in Elasticsearch 1.x, 2.x and 5.x

# CLI

Install it as a global module if only the CLI is going to be used:

```
npm install es-fixtures -g
```

The CLI can be executed through `node_modules/.bin/es-fixtures` if it is installed locally.

All the methods defined in the API can be executed through the CLI. The `data` parameter expected in some methods can be obtained through a `.js` file or a `.json` file.


```
es-fixtures <command-name> <index-name> <type-name> [data-file] [-h host] [-l log] [-i incremental] [-v version]
```

For example:

```bash
echo '[{"name": "Dio"}]' > fixtures.json
es-fixtures load my_index my_type fixtures.json
```

```bash
echo 'module.exports = [{name: "Dio"}]' > fixtures.js
es-fixtures load my_index my_type fixtures.js -i

echo 'module.exports = [{name: "Abdul"},{name: "Polnareff"}]' > fixtures2.js
es-fixtures clearAndLoad my_index my_type fixtures2.js
```

```bash
es-fixtures clear my_index my_type
```

### options

- `-h` By default it will run in local, but `host` can be specified.
- `-l` Also logging level can be specified setting `log`, by default it will be off
- `-i` Incremental mode for `load` method, by default insert random `_id`
- `-v` Specify Elasticsearch API version, it should work without setting it, but could be good to set it just in case in the future the API changes

For example:

```bash
es-fixtures clear my_index my_type -h http://foo.bar:9200 -l trace
```

# API

## bootstrap(index, type, config)

Returns a new Loader instance, configured to interact by default with the specified `index` and `type`.

`config` parameter is optional, by default it will contain `{ host: 'localhost:9200' }`.
A list of available options is specified in the driver official [documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html).


```js
const loader = require('es-fixtures').bootstrap('my_index', 'my_type');
```
```js
const loader = require('es-fixtures').bootstrap('my_index', 'my_type', {
  host: 'http://foo.bar:0000',
  log: 'trace'
});
```

## Instance methods

### bulk(data, callback)

Perform many index/delete operations in a single API call using the Elasticsearch bulk API. The possible actions are index, create, delete and update.

`data` is an array of objects, the format is specified [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html). A JSONLines string or Buffer can be used as well.

```js
const data = [
  // action description
  { index: { _id: 1 } },
   // the document to index
  { title: 'foo' },
  // action description
  { update: { _id: 2 } },
  // the document to update
  { doc: { title: 'foo' } },
  // action description
  { delete: { _id: 3 } },
  // no document needed for this delete
];
loader.bulk(data)
  .catch(err => {
    // error handling
  });
```

### load(data, options, callback)

Add documents into the specified index and type. `data` contains an array of objects the documents to add to the index. It assigns a random `_id` (Elasticsearch default behaviour).

`options` is an optional argument. `incremental: true` insert documents assigning an incremental `_id` from 1 instead of a random one. It will overwrite existent documents with the same `_id`.

```js
const data = [{
  name: 'Jotaro',
  standName: 'Star Platinum'
}, {
  name: 'Jolyne',
  standName: 'Stone Free'
}];

const options = {
  incremental: true
};

loader.load(data, options)
  .catch(err => {
    // error handling
  });
```

Also, it is possible to add the desired `_id` inside each document (used altogether with `incremental: true` will fail).

```js
const data = [{
  _id: 1,
  name: 'Jotaro',
  standName: 'Star Platinum'
}, {
  _id: 2,
  name: 'Jolyne',
  standName: 'Stone Free'
}];

loader.load(data, options)
  .catch(err => {
    // error handling
  });
```

### clear(callback)

Delete all the documents in the index and type specified when bootstraping. It only deletes the document, the type mapping is kept intact.

```js
loader.clear()
  .catch(err => {
    // error handling
  });
```

### clearAndLoad(data, options, callback)

Delete all the documents in the index and type specified and load new ones. Basically executes first `.clear()` and then `.load()` (check them to see more details).

```js
const data = [{
  name: 'Josuke',
  standName: 'Crazy Diamond'
}, {
  name: 'Joseph',
  standName: 'Hermit Purple'
}];

loader.clearAndLoad(data)
  .catch(err => {
    // error handling
  });
```

### recreateIndex(data, callback)

Delete index and create it again. `data` is optional: providing type mappings while recreating the index is possible, as well as other settings, format [here](https://www.elastic.co/guide/en/elasticsearch/reference/2.4/indices-create-index.html).

For example, can be useful to get a fresh index with a particular mapping each time a unit test is executed.

```js
const data = {
  mappings: {
    my_type: {
      properties: {
        name: {
          type: 'string'
        }
      }
    }
  }
};

loader.recreateIndex(data)
  .catch(err => {
    // error handling
  });
```

### addMapping(data, callback)

Provide a mapping to the specified type when bootstraping. The index must already exist. `data` format is specified [here](https://www.elastic.co/guide/en/elasticsearch/reference/2.4/indices-put-mapping.html).

```js
const data = {
  properties: {
    name: {
      type: 'string'
    }
  }
};
loader.addMapping(data)
  .catch(err => {
    // error handling
  });
```

# Installation

```
npm install es-fixtures
```

# Tests

```bash
npm test
```

Tests run using [AVA](https://github.com/avajs/ava).

Elasticsearch server must be running in local (localhost:9200) in order for the tests to run correctly.

---

Issues, pull requests or stars are appreciated.