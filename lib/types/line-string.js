'use strict';
var util = require('util');
var Geometry = require('./geometry');
var Point = require('./point');
var os = require('os');

/**
 * Creates a new {@link LineString} instance.
 * @classdesc
 * A LineString is a one-dimensional object representing a sequence of points and the line segments connecting them.
 * @param [arguments] The sequence of {@link Point} items as arguments.
 * @example
 * new LineString(new Point(10.99, 20.02), new Point(14, 26), new Point(34, 1.2));
 * @constructor
 * @extends {Geometry}
 */
function LineString() {
  var points = Array.prototype.slice.call(arguments);
  if (points.length === 1 && util.isArray(points) && util.isArray(points[0])) {
    //The first argument is an array of the points
    points = points[0];
  }
  if (points.length === 1) {
    throw new TypeError('LineString can be either empty or contain 2 or more points');
  }
  /**
   * Returns a frozen Array of points that represent the line.
   * @type {Array.<Point>}
   */
  this.points = Object.freeze(points);
}

util.inherits(LineString, Geometry);

/**
 * Creates a {@link LineString} instance from
 * a <a href="https://en.wikipedia.org/wiki/Well-known_text">Well-known Text (WKT)</a>
 * representation of a line.
 * @param {Buffer} buffer
 * @returns {LineString}
 */
LineString.fromBuffer = function (buffer) {
  if (!buffer || buffer.length < 9) {
    throw new TypeError('A linestring buffer should contain at least 9 bytes');
  }
  var endianness = Geometry.getEndianness(buffer.readInt8(0, true));
  var offset = 1;
  if (Geometry.readInt32(buffer, endianness, offset) !== Geometry.types.LineString) {
    throw new TypeError('Binary representation was not a LineString');
  }
  offset += 4;
  var length = Geometry.readInt32(buffer, endianness, offset);
  offset += 4;
  if (buffer.length !== offset + length * 16) {
    throw new TypeError(util.format('Length of the buffer does not match %d !== %d', buffer.length, offset + length * 8));
  }
  var points = new Array(length);
  for (var i = 0; i < length; i++) {
    points[i] = new Point(
      Geometry.readDouble(buffer, endianness, offset),
      Geometry.readDouble(buffer, endianness, offset + 8));
    offset += 16;
  }
  return new LineString(points);
};

/**
 * Returns a <a href="https://en.wikipedia.org/wiki/Well-known_text#Well-known_binary">Well-known Binary</a> (WKB)
 * representation of this instance.
 * @returns {Buffer}
 */
LineString.prototype.toBuffer = function () {
  var buffer = new Buffer(9 + this.points.length * 16);
  this.writeEndianness(buffer, 0);
  var offset = 1;
  this.writeInt32(Geometry.types.LineString, buffer, offset);
  offset += 4;
  this.writeInt32(this.points.length, buffer, offset);
  offset += 4;
  this.points.forEach(function (p) {
    this.writeDouble(p.x, buffer, offset);
    this.writeDouble(p.y, buffer, offset + 8);
    offset += 16;
  }, this);
  return buffer;
};

/**
 * Returns true if the values of the linestrings are the same, otherwise it returns false.
 * @param {LineString} other
 * @returns {Boolean}
 */
LineString.prototype.equals = function (other) {
  if (!(other instanceof LineString)) {
    return false;
  }
  if (this.points.length !== other.points.length) {
    return false;
  }
  for (var i = 0; i < this.points.length; i++) {
    if (!this.points[i].equals(other.points[i])) {
      return false;
    }
  }
  return true;
};

/**
 * Returns Well-known text (WKT) representation of the geometry object.
 * @returns {String}
 */
LineString.prototype.toString = function () {
  if (this.points.length === 0) {
    return 'LINESTRING EMPTY';
  }
  return 'LINESTRING ('
    + this.points.map(function (p) {
      return p.x + ' ' + p.y
    }).join(', ')
    + ')';
};

LineString.prototype.isOSBE = function () {
  return os.endianness() === 'BE';
};

/**
 * Returns a JSON representation of this geo-spatial type.
 */
LineString.prototype.toJSON = function () {
  return { type: 'LineString', coordinates: this.points.map(function (p) {
    return [p.x, p.y];
  })};
};

module.exports = LineString;