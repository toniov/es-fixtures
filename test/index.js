'use strict';

const esFixtures = require('../src');
const test = require('ava');
// use a different index for each test
const indexes = ['bulk_index', 'clear_index', 'recreate_index', 'recreate_unexistent_index', 'mapping_index', 'load_random_index', 'load_incremental_index'];

test.before('delete indexes in case they exist', async () => {
  const client = esFixtures.bootstrap().client;
  indexes.forEach(async (index) => {
    await client.indices.delete({
      index: index,
      ignore: [404]
    });
  });
});

test('should use bulk properly', async (t) => {
  const loader = esFixtures.bootstrap('bulk_index', 'my_type', 'recreate_index');
  const data = [
    { index: { _id: 1 } },
    { name: 'Jotaro' },
    { index: { _id: 2 } },
    { name: 'Joline' },
  ];
  const result = await loader.bulk(data);
  t.false(result.errors);
});

test('should clear all documents', async (t) => {
  const loader = esFixtures.bootstrap('clear_index', 'my_type');
  // insert mock data
  for (let i = 0; i < 1000; i++) {
    let doc = await loader.client.create({
      index: 'clear_index',
      type: 'my_type',
      id: i,
      refresh: true,
      body: {
        title: `Inserted in ${i} place`,
      }
    });
  }
  // count inserted number of documents
  const countBefore = await loader.client.count({
    index: 'clear_index',
    type: 'my_type'
  });
  t.is(countBefore.count, 1000);
  // delete all inserted documents
  await loader.clear();
  // count again deleting them
  const countAfter = await loader.client.count({
    index: 'clear_index',
    type: 'my_type'
  });
  t.is(countAfter.count, 0);
});

test('should re-create existent index', async (t) => {
  const loader = esFixtures.bootstrap('recreate_index', 'my_type');
  await loader.client.indices.create({
    index: 'recreate_index'
  });
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
  await loader.recreateIndex(data);
  t.notThrows(loader.client.indices.get({
    index: 'recreate_index'
  }));
});

test('should just create index if it does not exist', async (t) => {
  const loader = esFixtures.bootstrap('recreate_unexistent_index', 'my_type');
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
  await loader.recreateIndex(data);
  t.notThrows(loader.client.indices.get({
    index: 'recreate_unexistent_index'
  }));
});

test('should add mapping', async (t) => {
  const loader = esFixtures.bootstrap('mapping_index', 'my_type');
  await loader.client.indices.create({
    index: 'mapping_index'
  });
  const data = {
    properties: {
      name: {
        type: 'string'
      }
    }
  };
  await loader.addMapping(data);
  const mapping = await loader.client.indices.getMapping({
    index: 'mapping_index',
    type: 'my_type'
  });
});

test('should add documents with random ids', async (t) => {
  const loader = esFixtures.bootstrap('load_random_index', 'my_type');
  const data = [{
    name: 'Jotaro',
    standName: 'Star Platinum'
  }, {
    name: 'Jolyne',
    standName: 'Stone Free'
  }];
  const result = await loader.load(data);
});

test('should add documents with random ids', async (t) => {
  const loader = esFixtures.bootstrap('load_incremental_index', 'my_type');
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
  const result = await loader.load(data, options);
  console.log(JSON.stringify(result, 0, 2))
});

test.after.always('remove created indexes', async () => {
  const client = esFixtures.bootstrap().client;
  indexes.forEach(async (index) => {
    await client.indices.delete({
      index: index,
      ignore: [404]
    });
  });
});
