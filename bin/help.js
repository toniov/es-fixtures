module.exports =
`Usage:
  esfix <cmd> [--host <host>] [--log <log-type>]
      By default, host is set localhost:9200 and log is set to 'info'.
      Log levels are 'warn', 'info', 'debug' and 'trace'.
      Some commands accept a data file, it can be of type .js or .json.

      OPTIONS
          -h, --host <host>
          -l, --log <log-type>

Commands:

  load <index> <type> <data-file> [-i] [-r]
      Index documents.
      By default, the documents will be inserted with a random ID set by Elasticsearch.
      If the document includes an '_id' field, it will be used as document ID (not compatible 
      with option -i).

      OPTIONS
          -i, --incremental
          -r, --refresh


  clear <index> [type] [-r]
      Delete all the documents from the specified index.
      If 'type' is specified, it will only delete all the documents included in that type.

      OPTIONS
          -r, --refresh


  clearAndLoad <index> <type> <data-file> [-i] [-r]
      First executes 'clear' command and then 'load' command. Same functionality as them.

      OPTIONS
          -i, --incremental

          -r, --refresh


  bulk [index] [type] <data-file> [-r]
      Perform bulk index/delete operations.
      'index' and 'type' are optional, they set default index and type for items which don’t provide ones.
      The format is specified here:
      https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html

      OPTIONS
          -r, --refresh


  createIndex <index> [data-file] [-f]
      Create an index.
      If -f is used, it will delete the index if it exists, and will re-create it.
      It can be created specifying 'settings' and 'mappings' in 'data-file', the format is detailed here:
      https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html#mappings

      OPTIONS
          -f, --force


  addMapping <index> <type> <data-file>
      Add mapping to a type.
      Index must exists in order to work.
      'data-file' format is specified here:
      https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-put-mapping.html


  help
      Show this help page.
`;
