'use strict';
const elasticsearch = require('elasticsearch');

exports.bootstrap = (index, type, options) => {
  return new Loader(index, type, options);
};

class Loader {
  /**
   * Create instance
   * Possible config can be checked here:
   * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html
   * @param {string} index - index by default used in the operations
   * @param {string} type - type by default used in the operations
   * @param {Object} [config] - config object
   */
  constructor (index, type, config) {
    this.client = new elasticsearch.Client(config);
    this.index = index;
    this.type = type;
  }

  /**
   * Index documents
   * @param {Object[]} data - must be in the format specified in the bulk API
   * @param {Object} [options]
   * @param {boolean} [options.incremental] - assign an incremental id instead of a random one (Default: false)
   * @param {boolean} [options.noRefresh] - avoid refreshing the index on each iteration
   * @param {Function} [callback] - only in case callback style is used
   * @return {Promise}
   */
  load (data, options, callback) {
    const bulkData = [];
    if (options && options.incremental) {
      let count = 1;
      data.forEach(doc => {
        bulkData.push({ index: { _id: count } });
        bulkData.push(doc);
        count++;
      });
    } else {
      data.forEach(doc => {
        if (doc._id) {
          bulkData.push({ index: { _id: doc._id } });
          delete doc._id;
        } else {
          bulkData.push({ index: {} });
        }
        bulkData.push(doc);
      });
    }

    return this.bulk(bulkData, options, callback);
  }

  /**
   * Delete all the documents
   * @param {Object} [options]
   * @param {boolean} [options.noRefresh] - avoid refreshing the index on each iteration
   * @param {Function} [callback] - only in case callback style is used
   * @return {Promise}
   */
  clear (options, callback) {
    const client = this.client;
    const index = this.index;
    const type = this.type;

    /**
     * Loop through all the docs and delete them using the scroll API
     * @return {Promise}
     */
    const deleteByScroll = () => {
      return client.search({
        scroll: '30s',
        index: index,
        type: type,
        sort: '_doc:asc',
        fields: []
      }).then(function loopAndDeleteDocs(response) {
        const promises = response.hits.hits.map((hit) => {
          return client.delete({
            index: index,
            type: type,
            id: hit._id,
            refresh: !(options && options.noRefresh)
          });
        });
        return Promise.all(promises).then(() => {
          return client.scroll({
            scrollId: response._scroll_id,
            scroll: '30s'
          });
        }).then(response => {
          // call this function recursively until all docs have been deleted
          if (response.hits.hits.length > 0) {
            return loopAndDeleteDocs(response);
          }
          if (callback) {
            callback();
          }
        });
      });
    };

    return client.info().then(info => {
      const version = info.version.number;
      if (version.slice(0,1) === '2') {
        return deleteByScroll();
      } else {
        return client.deleteByQuery({
          index: index,
          type: type,
          refresh: !(options && options.noRefresh)
        });
      }
    }).catch(err => {
      if (callback) {
        return callback(err);
      }
      throw err;
    });
  }

  /**
   * Delete all documents and add new ones
   * @param {Object[]} data - must be in the format specified in the bulk API
   * @param {Object} [options]
   * @param {boolean} [options.incremental] - assign an incremental id instead of a random one
   * @param {boolean} [options.noRefresh] - avoid refreshing the index on each iteration
   * @param {Function} [callback] - only in case callback style is used
   * @return {Promise}
   */
  clearAndLoad (data, options, callback) {
    return this.clear().then(() =>
      this.load(data, options, callback)
    );
  }

  /**
   * Perform operations using bulk API
   * More info: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
   * @param {Object[]} data - must be in the format specified in the bulk API
   * @param {Object} [options]
   * @param {boolean} [options.noRefresh] - avoid refreshing the index on each iteration
   * @param {Function} [callback] - only in case callback style is used
   * @return {Promise}
   */
  bulk (data, options, callback) {
    return this.client.bulk({
      index: this.index,
      type: this.type,
      body: data,
      refresh: !(options && options.noRefresh)
    }).then(result => {
      if (callback && typeof callback === 'function') {
        return callback(null, result);
      }
      return result;
    }).catch(err => {
      if (callback && typeof callback === 'function') {
        return callback(err);
      }
      throw err;
    });
  }

  /**
   * Create index with optional settings
   * @param {Object} [data] - optional settings, must be in the format specified
   * @param {Object} [options]
   * @param {boolean} [options.force] - force creation, delete index if exist
   * @param {Function} [callback] - only in case callback style is used
   * @return {Promise}
   */
  createIndex (data, options, callback) {
    let p = Promise.resolve();
    if (options && options.force) {
      p = this.client.indices.delete({
        index: this.index,
        ignore: [404]
      });
    }
    return p.then(() => {
      return this.client.indices.create({
        index: this.index,
        body: data
      });
    }).then(() => {
      if (callback && typeof callback === 'function') {
        callback();
      }
    }).catch(err => {
      if (callback && typeof callback === 'function') {
        return callback(err);
      }
      throw err;
    });
  }

  /**
   * Add mapping to specified type
   * @param {Object} data - mapping data
   * @param {Function} [callback] - only in case callback style is used
   * @return {Promise}
   */
  addMapping (data, callback) {
    return this.client.indices.putMapping({
      index: this.index,
      type: this.type,
      body: data
    }).catch(err => {
      if (callback && typeof callback === 'function') {
        return callback(err);
      }
      throw err;
    });
  }
}
