# Elasticsearch Fixtures

> Simple fixture loading for Elasticsearch on Node.js. 

[![Build Status](https://travis-ci.org/toniov/es-fixtures.svg?branch=master)](https://travis-ci.org/toniov/es-fixtures)

Clear and load fixtures easily in your Elasticsearch instance, useful for unit Testing or other kind of testing.

Tested in Elasticsearch 0.x, 1.x, 2.x and 5.x.

## Contents

- [Command-line Interface](#command-line-interface)
  - [Examples](#examples)
  - [Installation](#installation)
  - [API](#api)
    - [load](#load)
    - [clear](#clear)
    - [clearAndLoad](#clearandload)
    - [bulk](#bulk)
    - [createIndex](#createindex)
    - [addMapping](#addmapping)
    - [help](#help)
- [Used as module](#used-as-module)
  - [Installation](#installation-1)
  - [API](#api-1)
    - [bootstrap](#bootstrapindex-type-config)
    - [Instance methods](#instance-methods)
      - [load](#loaddata-options-callback)
      - [clear](#clearcallback)
      - [clearAndLoad](#clearandloaddata-options-callback)
      - [bulk](#bulkdata-options-callback)
      - [createIndex](#createindexdata-callback)
      - [addMapping](#addmappingdata-callback)

# Command-line Interface

It can be used out-of-box without any prior configuration, following examples run in `localhost:9200` by default.

## Examples

Load fixtures using a .json file:

<pre>
<b>fixtures.json</b>

[{
  "name": "Dio",
  "standName": "The World",
  "age": 122
},{
  "name": "Jotaro",
  "standName": "Star Platinum",
  "age": 17
}]
</pre>
```
$ esfix load my_index my_type fixtures.json
```

Clear all the data in `my_index`/`my_type`:

```
$ esfix clear my_index my_type
```

Both `clear` and `load` commands executed at once:

```
$ esfix clearAndLoad my_index my_type fixtures.json
```

Perform index/delete operations using the bulk API. The next command will index two documents, update one and delete another one:

<pre>
<b>fixtures-bulk.json</b>

[
 { "index":  { "_id": 1 } },
 { "title": "Random title 1", "summary": "Random summary 1" },
 { "index":  { "_id": 2 } },
 { "title": "Random title 2", "summary": "Random summary 2" },
 { "update": { "_id": 3 } },
 { "doc": { "title": "New title" } },
 { "delete": { "_id": 4 } }
]
</pre>

```
$ esfix bulk my_index my_type fixtures-bulk.json
```

## Installation

Install it as a global module if only the CLI is going to be used:

```
npm install esfix -g
```

## API

**`esfix <cmd> [--host <host>] [--log <log-type>]`**

By default, `--host` is set `localhost:9200` and `--log` is set to `info`. Log levels are `warn`, `info`, `debug` and `trace`.


### load

**`load <index> <type> <data-file> [-i] [-r]`**

Index documents.

By default, the documents will be inserted with a random ID set by Elasticsearch.
If the document includes an `_id` field, it will be used as the document ID (not compatible with option `-i`).
The bulk API is used under the hood.

`-i, --incremental` assign an incremental id starting from 1

`-r, --refresh` force a refresh each time an operation is executed

***Examples***


Index documents with an incremental id:

```
$ esfix load my_index my_type fixtures.json -i
```

Index documents using a `.js` file, this allows to insert some relative values like dates or other kind of logic:

<pre>
<b>fixtures.js</b>

module.exports = [{
  name: 'Dio',
  standName: 'The World',
  age: 122,
  created: new Date() // current date
},{
  name: 'Jotaro',
  standName: 'Star Platinum',
  age: 17,
  created: new Date() // current date
}];
</pre>
```
$ esfix load my_index my_type fixtures.json
```

### clear

**`clear <index> [type] [-r]`**

Delete all the documents from the specified index. If `type` is specified, it will only delete all the documents included in that type.

`-r, --refresh` force a refresh each time an operation is executed

**Example**

Clear index `my_index`:

```
$ esfix clear my_index
```

### clearAndLoad

**`clearAndLoad <index> <type> <data-file> [-i] [-r]`**

First executes `clear` command and then `load` command. Same functionality as them.

`-i, --incremental` assign an incremental id starting from 1
`-r, --refresh` force a refresh each time an operation is executed

**Example**

Clear all the data in `my_index`/`my_type` and load the data in `fixtures.json`:

```
$ esfix clearAndLoad my_index my_type fixtures.json
```

### bulk

**`bulk [index] [type] <data-file> [-r]`**

Perform bulk index/delete operations.

The format of `data-file` is an array of:

```
action_and_meta_data
optional_source
```

The possible actions are `index`, `create`, `delete` and `update`. More information about bulk API [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html).

`index` and `type` are optional, they set default index and type for items which don’t provide ones.

`-r, --refresh` force a refresh each time an operation is executed

**Examples**

Index two documents in two different indexes:

<pre>
<b>fixtures.json</b>

[
 { "index":  { "_index": "my_index", "_type": "my_type",  "_id": 1 } },
 { "name": "Yukko", "occupation": "student" },
 { "index":  { "_index": "my_index2", "_type": "my_type",  "_id": 1 } },
 { "name": "Sakamoto", "occupation": "mascot" }
]
</pre>

```
$ esfix bulk fixtures.json
```

Delete and update documents in index `my_index`, `delete` does not expect a following line:

<pre>
<b>fixtures.json</b>

[
 { "delete": { "_id": 1 } }
 { "delete": { "_id": 2 } }
 { "update": { "_id": 3 } },
 { "doc": { "occupation": "Pole dancer" } },
]
</pre>

```
$ esfix bulk fixtures.json
```

Using a .js file we can, for example, index 1000 documents with a random `age` field with a value between 18 and 60:

```js
// generated-fixtures.js
module.exports = (() => {
  const bulkData = [];
  for (let i = 0; i < 1000; i++) {
    bulkData.push({ index: { } });
    bulkData.push({ name: `User ${i}`, age: Math.floor(Math.random() * 60) + 18 });
  }
  return bulkData;
})();
```

```
$ esfix bulk my_index my_type generated-fixtures.js
```

### createIndex

**`createIndex <index> [data-file] [-f]`**

Create an index.

`data-file` is optional, `settings` and `mappings` can be specified there, the format is detailed [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html#mappings).

`-f, --force` will delete the index if it exists, and it will be re-created

**Example**

Delete if exists, and create an index with the following `settings` and `mappings`:

<pre>
<b>index-info.json</b>

{
  "settings" : {
    "number_of_shards" : 1
  },
  "mappings" : {
    "my_type" : {
      "properties" : {
        "age" : { "type" : "short" }
      }
    }
  }
}
</pre>

```
$ esfix createIndex my_index index-info.json -f
```

### addMapping

**`addMapping <index> <type> <data-file>`**

Add mapping to a type. 
Index must exists in order to work.
`data-file` format is specified [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-put-mapping.html):

**Example**

Add mapping to index `my_index` and type `my_type`

<pre>
<b>mapping-info.json</b>

{
  "properties": {
    "age": {
      "type": "byte"
    }
  }
}
</pre>

```
$ esfix addMapping my_index my_type mapping-info.json
```

### help

**`help`**

Show help page.

# Used as module

It can be required in your code, useful to automate unit tests.

All the methods from the CLI can be used here, but there are some small differences. In the CLI, by default, after each operation the index is not refreshes, but when used as a module it is refreshed everytime; for unit testing usually we need the data without any lag.

All methods return a Promise if a callback is not specified.

## Examples

Index two documents with an incremental id:

```js
const esfix = require('esfix');
const loader = esfix.bootstrap('my_index', 'my_type');

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
  .then(() => {
    console.log('Documents were indexed');
  })
  .catch(err => {
    // error handling
  });
```

Prepare a fresh index, for example, to execute a Unit Test:

```js
const esfix = require('esfix');
const loader = esfix.bootstrap('users', 'user');

const indexInfo = require('./fixtures/users/index-info.json');
const userData = require('./fixtures/users/data.json');

loader.createIndex(indexInfo, { force: true })
  .then(() => loader.load(userData))
  .then(() => {
    console.log('Documents were indexed');
  })
  .catch(err => {
    // error handling
  });
```

## Installation

```
npm install esfix
```

## API

### bootstrap(index, type, config)

Returns a new Loader instance, configured to interact by default with the specified `index` and `type`.

`config` parameter is optional, by default it will contain `{ host: 'localhost:9200' }`.
A list of available options is specified in the driver official [documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html).

```js
const loader = require('esfix').bootstrap('my_index', 'my_type');
```

```js
const loader = require('esfix').bootstrap('my_index', 'my_type', {
  host: 'http://foo.bar:0000',
  log: 'trace'
});
```

### Instance methods

#### load(data, [options], [callback])

Add documents into the specified index and type. 

`data` contains an array of objects the documents to add to the index. It assigns a random `_id` (Elasticsearch default behaviour).

`options` is optional. 
`options.incremental: true` insert documents assigning an incremental `_id` from 1 instead of a random one. It will overwrite existent documents with the same `_id`. 
`options.noRefresh: true` avoid refreshing the index after each operation.

`callback` is optional, in case it is not set a `Promise` is returned.

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

Also, it is possible to add the desired `_id` inside each document (can't be used altogether with `incremental: true`).

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

#### clear([callback])

Delete all the documents in the index and type specified when bootstraping. It only deletes the document, the type mapping is kept intact.

`callback` is optional, in case it is not set a `Promise` is returned.

```js
loader.clear()
  .catch(err => {
    // error handling
  });
```

#### clearAndLoad(data, [options], [callback])

Delete all the documents in the index and type specified and load new ones. Basically executes first `.clear()` and then `.load()` (check them to see more details).

`data` contains an array of objects the documents to add to the index. It assigns a random `_id` (Elasticsearch default behaviour).

`options` is optional. 
`options.incremental: true` insert documents assigning an incremental `_id` from 1 instead of a random one. It will overwrite existent documents with the same `_id`. 
`options.noRefresh: true` avoid refreshing the index after each operation.

`callback` is optional, in case it is not set a `Promise` is returned.

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

#### bulk(data, [options], [callback])

Perform many index/delete operations in a single API call using the Elasticsearch bulk API. The possible actions are index, create, delete and update.

`data` is an array of objects, the format is specified [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html). A JSONLines string or Buffer can be used as well.

`options` is optional. 
`options.noRefresh: true` avoid refreshing the index after each operation.

`callback` is optional, in case it is not set a `Promise` is returned.

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

#### createIndex([data], [callback])

Delete index and create it again. 

`data` is optional: providing type mappings while recreating the index is possible, as well as other settings, format is specified [here](https://www.elastic.co/guide/en/elasticsearch/reference/2.4/indices-create-index.html).

`callback` is optional, in case it is not set a `Promise` is returned.

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

loader.createIndex(data)
  .catch(err => {
    // error handling
  });
```

#### addMapping(data, [callback])

Provide a mapping to the specified type when bootstraping. The index must already exist. 

`data` format is specified [here](https://www.elastic.co/guide/en/elasticsearch/reference/2.4/indices-put-mapping.html).

`callback` is optional, in case it is not set a `Promise` is returned.

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

## License

MIT © [Antonio V](https://github.com/toniov)
