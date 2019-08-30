"use strict";

function random (min,max) {
	return ~~(Math.random() * (max - min) + min);
}

function isUfe (object) {
	return typeof object === 'undefined' || object === undefined;
}

function arrSlice (object) {
	return [].slice.call(object);
}

function isArray (object) {
	return object instanceof Array;
}

function isFunc (object) {
	return typeof object === 'function';
}

function isStr (object) {
	return typeof object === 'string';
}

function createObjectIdent (ident = "") {
	return Number(Math.random().toString().substr(3,length) + Date.now()).toString(36) + random(111111,999999) + ident;
}