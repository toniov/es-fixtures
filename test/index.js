'use strict';

const esFixtures = require('../src');
const test = require('ava');
// use a different index for each test
const indexes = ['bulk_index', 'clear_index', 'create_index', 'create_unexistent_index', 'mapping_index', 
  'load_random_index', 'load_incremental_index', 'clear_load_index', 'load_assigned_id_index'];
const type = 'my_type';

test.before('delete indexes in case they exist', async () => {
  const client = esFixtures.bootstrap().client;
  const arrayOfPromsies = indexes.map(async (index) => {
    return client.indices.delete({
      index: index,
      ignore: [404]
    });
  });
  await Promise.all(arrayOfPromsies);
});

test('should use bulk properly', async (t) => {
  const loader = esFixtures.bootstrap('bulk_index', type);
  const data = [
    { index: { _id: 1 } },
    { name: 'Jotaro' },
    { index: { _id: 2 } },
    { name: 'Jolyne' },
  ];
  const result = await loader.bulk(data);
  t.false(result.errors);
});

test('should clear all documents', async (t) => {
  const index = 'clear_index';
  const loader = esFixtures.bootstrap(index, type);
  // insert mock data
  for (let i = 0; i < 100; i++) {
    await loader.client.create({
      index: index,
      type: type,
      id: i,
      refresh: true,
      body: {
        title: `Inserted in ${i} place`,
      }
    });
  }
  // count inserted number of documents
  const countBefore = await loader.client.count({
    index: index,
    type: type
  });
  t.is(countBefore.count, 100);
  // delete all inserted documents
  await loader.clear();
  // count again deleting them
  const countAfter = await loader.client.count({
    index: index,
    type: type
  });
  t.is(countAfter.count, 0);
});

test('should re-create existent index', async (t) => {
  const loader = esFixtures.bootstrap('create_index', type);
  await loader.client.indices.create({
    index: 'create_index'
  });
  const data = {
    mappings: {
      my_type_old: {
        properties: {
          name: {
            type: 'string'
          }
        }
      }
    }
  };
  await loader.createIndex(data, { force: true });
  t.notThrows(loader.client.indices.get({
    index: 'create_index'
  }));
});

test('should create index if it does not exist', async (t) => {
  const index = 'create_unexistent_index';
  const loader = esFixtures.bootstrap(index, type);
  const data = {
    mappings: {
      [type]: {
        properties: {
          name: {
            type: 'string'
          }
        }
      }
    }
  };
  await loader.createIndex(data);
  t.notThrows(loader.client.indices.get({
    index: 'create_unexistent_index'
  }));
});

test('should add mapping', async (t) => {
  const index = 'mapping_index';
  const loader = esFixtures.bootstrap(index, type);
  await loader.client.indices.create({
    index: index
  });
  const data = {
    properties: {
      name: {
        type: 'string'
      }
    }
  };
  await loader.addMapping(data);
  const mappingRes = await loader.client.indices.getMapping({
    index: index,
    type: type
  });
  t.truthy(mappingRes[index].mappings[type]);
});

test('should add documents with random ids', async (t) => {
  const index = 'load_random_index';
  const loader = esFixtures.bootstrap(index, type);
  const data = [{
    name: 'Jotaro',
    standName: 'Star Platinum'
  }, {
    name: 'Jolyne',
    standName: 'Stone Free'
  }];
  await loader.load(data);

  // check it was inserted correctly
  const searchResult = (await loader.client.search({
    index: index
  })).hits.hits;
  const result1 = searchResult.some(result => result._source.name === 'Jotaro');
  const result2 = searchResult.some(result => result._source.name === 'Jolyne');
  t.is(searchResult.length, 2);
  t.true(result1);
  t.true(result2);
});

test('should add documents with incremental ids', async (t) => {
  const index = 'load_incremental_index';
  const loader = esFixtures.bootstrap(index, type);
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
  await loader.load(data, options);

  // check it was inserted correctly
  const searchResult = (await loader.client.search({
    index: index
  })).hits.hits;
  const result1 = searchResult.find(result => result._id === '1');
  const result2 = searchResult.find(result => result._id === '2');
  t.is(result1._source.name, 'Jotaro');
  t.is(result2._source.name, 'Jolyne');
});

test('should add documents with id specified inside doc', async (t) => {
  const index = 'load_assigned_id_index';
  const loader = esFixtures.bootstrap(index, type);
  const data = [{
    _id: 1,
    name: 'Jotaro',
    standName: 'Star Platinum'
  }, {
    _id: 2,
    name: 'Jolyne',
    standName: 'Stone Free'
  }];
  await loader.load(data);

  // check it was inserted correctly
  const searchResult = (await loader.client.search({
    index: index
  })).hits.hits;
  const result1 = searchResult.find(result => result._id === '1');
  const result2 = searchResult.find(result => result._id === '2');
  t.is(result1._source.name, 'Jotaro');
  t.is(result2._source.name, 'Jolyne');
});

test('should clear and add documents with random ids', async (t) => {
  const loader = esFixtures.bootstrap('clear_load_index', type);
  // insert mock data
  for (let i = 0; i < 100; i++) {
    await loader.client.create({
      index: 'clear_load_index',
      type: type,
      id: i,
      refresh: true,
      body: {
        title: `Inserted in ${i} place`,
      }
    });
  }
  // count inserted number of documents
  const countBefore = await loader.client.count({
    index: 'clear_load_index',
    type: type
  });
  t.is(countBefore.count, 100);
  // delete all inserted documents and add new ones
  const data = [{
    name: 'Jotaro',
    standName: 'Star Platinum'
  }, {
    name: 'Jolyne',
    standName: 'Stone Free'
  }];
  await loader.clearAndLoad(data, { refresh: false });
  // count again after clearing and loading them
  const countAfter = await loader.client.count({
    index: 'clear_load_index',
    type: type
  });
  t.is(countAfter.count, 2);
});

test.after.always('remove created indexes', async () => {
  const client = esFixtures.bootstrap().client;
  const arrayOfPromises = indexes.map((index) => {
    return client.indices.delete({
      index: index,
      ignore: [404]
    });
  });
  await Promise.all(arrayOfPromises);
});
