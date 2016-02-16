'use strict';
var cassandra = require('cassandra-driver');
var Geometry = require('./types/geometry');
var Circle = require('./types/circle');
var Point = require('./types/point');
var Polygon = require('./types/polygon');
var LineString = require('./types/line-string');

var dseDecoders = {
  'org.apache.cassandra.db.marshal.CircleType': decodeCircle,
  'org.apache.cassandra.db.marshal.LineStringType': decodeLineString,
  'org.apache.cassandra.db.marshal.PointType': decodePoint,
  'org.apache.cassandra.db.marshal.PolygonType': decodePolygon
};

/**
 * @param {Encoder} EncoderConstructor
 */
function register(EncoderConstructor) {
  if (EncoderConstructor['_hasDseExtensions']) {
    return;
  }
  EncoderConstructor.prototype.baseDecode = EncoderConstructor.prototype.decode;
  EncoderConstructor.prototype.decode = decodeDse;
  EncoderConstructor.prototype.baseEncode = EncoderConstructor.prototype.encode;
  EncoderConstructor.prototype.encode = encodeDse;
  EncoderConstructor['_hasDseExtensions'] = true;
}

function decodeDse(buffer, type) {
  if (buffer != null && type.code === cassandra.types.dataTypes.custom) {
    var func = dseDecoders[type.info];
    if (func) {
      return func.call(this, buffer);
    }
  }
  return this.baseDecode(buffer, type);
}

function encodeDse(value, typeInfo) {
  if (value && value instanceof Geometry) {
    if (value instanceof Circle) {
      return encodeCircle.call(this, value);
    }
    if (value instanceof LineString) {
      return encodeLineString.call(this, value);
    }
    if (value instanceof Point) {
      return encodePoint.call(this, value);
    }
    if (value instanceof Polygon) {
      return encodePolygon.call(this, value);
    }
  }
  return this.baseEncode(value, typeInfo);
}

/** @param {Buffer} buffer */
function decodeCircle(buffer) {
  return Circle.fromBuffer(buffer);
}

/** @param {Circle} value */
function encodeCircle(value) {
  return value.toBuffer();
}

/** @param {Buffer} buffer */
function decodeLineString(buffer) {
  return LineString.fromBuffer(buffer);
}

/** @param {LineString} value */
function encodeLineString(value) {
  return value.toBuffer();
}

/** @param {Buffer} buffer */
function decodePoint(buffer) {
  return Point.fromBuffer(buffer);
}

/** @param {LineString} value */
function encodePoint(value) {
  return value.toBuffer();
}

/** @param {Buffer} buffer */
function decodePolygon(buffer) {
  return Polygon.fromBuffer(buffer);
}

/** @param {Polygon} value */
function encodePolygon(value) {
  return value.toBuffer();
}


exports.register = register;