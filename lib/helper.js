'use strict';

const basicType = ['string', 'int', 'boolean', 'integer', 'number', 'file'];

function _isBasicType(type) {
  if (basicType.indexOf(type) !== -1) {
    return true;
  } 
  return false;
  
}

function _type(type) {
  if (type.toLowerCase() === 'byte') {
    return 'bytes';
  }

  if (type.toLowerCase() === 'date-time') {
    return 'string';
  }

  if (type.toLowerCase() === 'file') {
    return 'readable';
  }

  if (type.toLowerCase() === 'object') {
    return 'map[string]any';
  }
  return type.toLowerCase();
}
function _isUpper(code) {
  return code >= 65 && code <= 90;
}

function _startsWithMultiUpperCase(name) {
  return _isUpper(name.charCodeAt(0)) && _isUpper(name.charCodeAt(1));
}

function _capitalize(name) {
  return name[0].toLowerCase() + name.substr(1);
}

function _upperFirst(str) {
  return str[0].toUpperCase() + str.substring(1);
}

function _prettify(name) {
  if (_startsWithMultiUpperCase(name)) {
    // 避免处理全大写的词
    return name;
  }

  if ((/[0-9]/).test(name[0])) {
    name = 'code' + name;
  }

  if (name.startsWith('$')) {
    name = name.substr(1);
  }
  name = name.replace(/-/g, '_');
  var strs = name.split(/_/g);
  var res = strs[0];
  for (let i = 1; i < strs.length; i++) {
    if (strs[i]) {
      res += _upperFirst(strs[i]);
    }
  }

  return _capitalize(res);
}

function _modelName(key) {
  var res = key.split('_').map((item) => {
    return item[0].toUpperCase() + item.slice(1);
  }).join('');

  res = res.split('.').map((item) => {
    return item[0].toUpperCase() + item.slice(1);
  }).join('');

  return res.split('-').map((item) => {
    return item[0].toUpperCase() + item.slice(1);
  }).join('');
}

function _split(str) {
  return str.replace(/-/g, '');
}

function _protocol(protocol) {
  if (protocol.includes('POST')) {
    return 'POST';
  }

  if (protocol.includes('PUT')) {
    return 'PUT';
  }

  if (protocol.includes('PATCH')) {
    return 'PATCH';
  }
  return protocol[0];
}

module.exports = {
  _prettify,
  _type,
  _modelName,
  _upperFirst,
  _split,
  _isBasicType,
  _protocol
};