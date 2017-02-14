# Elasticsearch Fixtures

Simple fixture loading for Elasticsearch on Node.js. Clean and load easily mock data in your Elasticsearch instance, useful for Unit Tests or other kind of testing.

# Features

- Compatible with callbacks and Promises
  - An optional callback will be called with the final result of the method. When omitted, a promise is returned
  - Native Promises usage
- ES6 usage
- Use the official [Elasticsearch javascript driver](https://github.com/elastic/elasticsearch-js) as the only dependency

# API

## bootstrap(index, type, config)

Returns a new Loader instance, configured to interact by the default with the specified `index` and `type`.

`config` parameter is optional, by default it will contain `{ host: 'localhost:9200' }`.
A list of available options is specified in the driver official [documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html).


```js
const esFixtures = require('es-fixtures').bootstrap('myIndex', 'myType');
```
```js
const esFixtures = require('es-fixtures').bootstrap('myIndex', 'myType', {
  host: 'http://foo.bar:0000',
  log: 'trace'
});
```

## bulk(data, callback)

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
esFixtures.bulk(data)
  .catch(err => {
    // error handling
  });
```

## clear(callback)

Delete all the documents in the index and type specified when bootstraping. It only deletes the document, the type mapping is kept intact.

```js
esFixtures.clear()
  .catch(err => {
    // error handling
  });
```

# Installation

```
npm install es-fixtures
```