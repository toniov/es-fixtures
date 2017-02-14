'use strict';
const elasticsearch = require('elasticsearch');
const defaultConfig = require('./config.js');

exports.bootstrap = (index, type, options) => {
  return new Loader(index, type, options);
};

class Loader {
  /**
   * Create instance
   * Possible config can be checked here:
   * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/configuration.html
   *
   * @param {string} index - index by default used in the operations
   * @param {string} type - type by default used in the operations
   * @param {Object} [config] - config object
   *
   */
  constructor (index, type, config) {
    // Create an ES instance
    const options = Object.assign({}, defaultConfig, config);
    this.client = new elasticsearch.Client(options);
    this.index = index;
    this.type = type;
  }

  /**
   * Perform operations using bulk API
   * More info: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
   *
   * @param {Object[]} data - must be in the format specified in the bulk API
   * @param {Function} [callback] - only in case callback style is used
   *
   * @return {Promise} only return promise if no callback is passed
   *
   */
  bulk (data, callback) {
    return this.client.bulk({
      index: this.index,
      type: this.type,
      body: data
    })
    .then(result => {
      if (callback) {
        return callback(null, result);
      }
      return result;
    })
    .catch(err => {
      if (callback) {
        return callback(err);
      }
      return err;
    });
  }

  /**
   * Delete all the documents
   *
   * @param {Function} [callback] - only in case callback style is used
   *
   * @return {Promise} only return promise if no callback is passed
   *
   */
  clear (callback) {
    const client = this.client;
    const loopAndDeleteDocs = response => {
      // delete all docs obtained in the last scroll search
      const promises = response.hits.hits.map((hit) => {
        console.log(this.index, this.type)
        return client.delete({
          index: this.index,
          type: this.type,
          id: hit._id
        });
      });
      return Promise.all(promises)
      // get next batch once the docs have been deleted
      .then(() => {
        return client.scroll({
          scrollId: response._scroll_id,
          scroll: '30s'
        });
      })
      // call this function recursively until all docs have been deleted
      .then(response => {
        if (response.hits.hits.length > 0) {
         return loopAndDeleteDocs(response); 
        }
        if (callback) {
          callback();
        }
      });
    };

    // initial search request, specifying the scroll parameter
    return client.search({
      scroll: '30s',
      index: this.index,
      type: this.type,
      fields: []
    })
    // loop through all the docs
    .then(loopAndDeleteDocs)
    .catch(err => {
      if (callback) {
        return callback(err);
      }
      return err;
    })
  }
}
