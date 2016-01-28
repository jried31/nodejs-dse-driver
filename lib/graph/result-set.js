'use strict';

/**
 * Creates a new instance of ResultSet
 * @class
 * @classdesc
 * Represents the result of a graph query
 * @param {ResultSet} result
 * @constructor
 */
function GraphResultSet(result) {
  Object.defineProperty(this, '_rows', { value: result.rows, enumerable: false, writable: false });
  /**
   * Information on the execution of a successful query:
   * @member {Object}
   * @property {Number} achievedConsistency The consistency level that has been actually achieved by the query.
   * @property {String} queriedHost The Cassandra host that coordinated this query.
   * @property {Object} triedHosts Gets the associative array of host that were queried before getting a valid response,
   * being the last host the one that replied correctly.
   * @property {Uuid} traceId Identifier of the trace session.
   * @property {Array.<string>} warnings Warning messages generated by the server when executing the query.
   */
  this.info = result.info;
  /**
   * Gets the length of the result.
   * @member {Number}
   */
  this.length = this._rows ? this._rows.length : 0;
  /**
   * A string token representing the current page state of query. It can be used in the following executions to
   * continue paging and retrieve the remained of the result for the query.
   * @name pageState
   * @type String
   * @memberof module:types~ResultSet#
   * @default null
   */
  Object.defineProperty(this, 'pageState', { get: function () { return result.getPageState(); }, enumerable: true });
}

/**
 * Returns the first element of the result or null if the result is empty.
 */
GraphResultSet.prototype.first = function () {
  if (!this.length) {
    return null;
  }
  return parseRow(this._rows[0]);
};

/**
 * Executes a provided function once per result element.
 * @param callback Function to execute for each element, taking two arguments: currentValue and index.
 * @param [thisArg] Value to use as <code>this</code> when executing callback.
 */
GraphResultSet.prototype.forEach = function (callback, thisArg) {
  if (!this.length) {
    return;
  }
  this._rows.forEach(function (row, i) {
    return callback(parseRow(row), i);
  }, thisArg);
};

/**
 * Results an Array of graph result elements (vertex, edge, scalar).
 * @returns {Array}
 */
GraphResultSet.prototype.toArray = function () {
  if (!this.length) {
    return [];
  }
  return this._rows.map(parseRow);
};

/**
 * Returns a new Iterator object that contains the values for each index in the result.
 * @returns {{next: function}}
 */
GraphResultSet.prototype.values = function () {
  if (!this.length) {
    return ({
      next: function () {
        return { done: true }
      }
    });
  }
  var index = 0;
  var rows = this._rows;
  return {
    next: function() {
      if (index < rows.length) {
        return { value: parseRow(rows[index++]), done: false };
      }
      else {
        return { done: true };
      }
    }
  };
};

//noinspection JSUnresolvedVariable
if (typeof Symbol !== 'undefined' && typeof Symbol.iterator === 'symbol') {
  //noinspection JSUnresolvedVariable
  /**
   * The value of the @@iterator property is the same function object as the value of the
   * {@link GraphResultSet#values()} function.
   * It allows iteration of the items using <code>for..of</code> statements.
   * @example
   * for (let vertex of result} { ... }
   */
  GraphResultSet.prototype[Symbol.iterator] = GraphResultSet.prototype.values;
}

/**
 * @param {Row} row
 * @private
 */
function parseRow(row) {
  return JSON.parse(row['gremlin'])['result'];
}

module.exports = GraphResultSet;