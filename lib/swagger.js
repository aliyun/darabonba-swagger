'use strict';

const {
  _prettify, _type, _modelName, _isBasicType, _protocol, _upperFirst
} = require('./helper');

class SwaggerConverter {
  constructor(meta) {
    this.meta = meta;
    this.extendsType = {};
    this.modelName = [];
    this.tags = {};
    this.output = '';
  }

  emit(str, level) {
    this.output += ' '.repeat(level * 2) + str;
  }

  emitType(property, level = 0) {
    if (_isBasicType(property.type)) {
      this.emit(`${_type(property.format || property.type)}`);
    } else if (property.type === 'object') {
      if (property.properties) {
        this.emit(`{\n`);
        this.emitProperties(property.properties, property.required || [], level + 1);
        this.emit(`}`, level);
      } else {
        this.emit(`map[string]any`);
      }
    } else if (property.items) {
      if (property.items.type === 'object') {
        if (property.items.properties) {
          this.emit(`[\n`);
          this.emit(`{\n`, level + 1);
          this.emitProperties(property.items.properties, property.items.required || [], level + 2);
          this.emit(`}\n`, level + 1);
          this.emit(`]`, level);
        } else {
          this.emit(`[ map[string]any ]`);
        }
      } else if (property.items === {}) {
        this.emit(`[ string ] `);
      } else if (property.items['$ref']) {
        let ref =  property.items['$ref'];
        let refName = ref.replace('#/definitions/', '');
        if (this.extendsType[_modelName(refName)]) {
          this.emit(`[ ${_type(this.extendsType[_modelName(refName)])} ] `);
        } else {
          this.emit(`[ ${_modelName(refName)} ] `);
        }
      } else {
        this.emit(`[ ${_type(property.items.type || 'string')} ] `);
      }
    } else if (property['$ref']) {
      let ref =  property['$ref'];
      let refName = ref.replace('#/definitions/', '');
      if (this.extendsType[_modelName(refName)]) {
        this.emit(`${_type(this.extendsType[_modelName(refName)])} `);
      } else {
        this.emit(`${_modelName(refName)} `);
      }
    } else if (property.schema && property.schema['$ref']) {
      let ref =  property.schema['$ref'];
      let refName = ref.replace('#/definitions/', '');
      if (this.extendsType[_modelName(refName)]) {
        this.emit(`${_type(this.extendsType[_modelName(refName)])} `);
      } else {
        this.emit(`${_modelName(refName)} `);
      }
    } else if (property.schema && property.schema.type === 'array' && property.schema.items['$ref']) {
      let ref = property.schema.items['$ref'];
      let refName = ref.replace('#/definitions/', '');
      if (this.extendsType[_modelName(refName)]) {
        this.emit(`[ ${_type(this.extendsType[_modelName(refName)])} ]`);
      } else {
        this.emit(`[ ${_modelName(refName)} ]`);
      }
    }
  }

  emitProperties(properties, required, level) { 
    Object.keys(properties).forEach(name => {
      const property = properties[name];
      //const desc = property.description || '';
      const paramRequired = required.indexOf(name) !== -1 ? true : false;
      this.emit(`${_prettify(name)}${paramRequired ? '' : '?'}: `, level);
      this.emitType(property, level);
      this.emit(`(name='${name}'),\n`);
    });
  }

  emitDefinitions(definitions) {
    Object.keys(definitions).forEach(name => {
      const definition = definitions[name];
      if (!definition.properties) {
        this.extendsType[_modelName(name)] = definition.type || 'string';
      }
    });  
    Object.keys(definitions).forEach(name => {
      const definition = definitions[name];
      if (!definition.properties) {
        return;
      }

      if (definition.description) {
        const strs = definition.description.split('\n');
        for (let i = 0; i < strs.length; i ++){
          this.emit(`// ${strs[i]} \n`, 0);
        }
      }
      this.emit(`model ${_modelName(name)} {\n`, 0);
      this.modelName.push(_modelName(name));
      this.emitProperties(definition.properties, definition.required || [], 1);
      this.emit(`}\n`, 0);
      this.emit(`\n`);
    });
  }

  emitParams(params, level) {
    params.forEach((p) => {
      this.emit(`${_prettify(p.name)}${p.required ? '' : '?'}: `, level);
      this.emitType(p.schema, level);
      this.emit(`(name='${p.name}'),\n`);
    });
  }

  convert() {
    var uniqueApiName = {};
    this.emit(`
import Util;

type @endpoint = string
type @protocol = string
type @userAgent = string
type @key = string
type @readTimeout = number
type @connectTimeout = number
type @httpProxy = string
type @httpsProxy = string
type @socks5Proxy = string
type @socks5NetWork = string
type @noProxy = string
type @cert = string
type @productId = string
type @maxIdleConns = number

/**
 * Model for initing client
 */
model Config {
  key?: string(description='Client Certs Key',default=''),
  cert?: string(description='Client Certs Cert',default=''),
  protocol?: string(description='http protocol',example='http',default='http'),
  regionId?: string(description='region id',example='cn-hangzhou',default=''),
  readTimeout?: number(description='read timeout',example='10',default=''),
  connectTimeout?: number(description='connect timeout',example='10',default=''),
  httpProxy?: string(description='http proxy',example='http://localhost',default=''),
  httpsProxy?: string(description='https proxy',example='https://localhost',default=''),
  endpoint?: string(description='endpoint',example='cs.aliyuncs.com',default=''),
  noProxy?: string(description='proxy white list',example='http://localhost',default=''),
  maxIdleConns?: number(description='max idle conns',example='3',default=''),
  userAgent?: string(description='user agent',example='Alibabacloud/1',default=''),
  socks5Proxy?: string(description='socks5 proxy',default=''),
  socks5NetWork?: string(description='socks5 network',example='TCP',default=''),
}

/**
 * Init client with Config
 * @param config config contains the necessary information to create a client
 */
init(config: Config) {
  if (Util.isUnset(config)) {
    throw {
      code = 'ParameterMissing',
      message = 'config can not be unset'
    };
  }

  @cert = config.cert;
  @key = config.key;
  @endpoint = config.endpoint;
  @protocol = config.protocol;
  @userAgent = config.userAgent;
  @readTimeout = config.readTimeout;
  @connectTimeout = config.connectTimeout;
  @httpProxy = config.httpProxy;
  @httpsProxy = config.httpsProxy;
  @noProxy = config.noProxy;
  @socks5Proxy = config.socks5Proxy;
  @socks5NetWork = config.socks5NetWork;
  @maxIdleConns = config.maxIdleConns;
}

model CommonRequest {
  headers?: map[string]string,
  query?: map[string]string,
  body?: string,
}

/**
 * Encapsulate the request and invoke the network
 * @param action api name
 * @param protocol http or https
 * @param method e.g. GET
 * @param pathname pathname of every api
 * @param bodyType response body type e.g. String
 * @param request object of CommonRequest
 * @param runtime which controls some details of call api, such as retry times
 * @return the response
 */
api doRequest(action: string, protocol: string, method: string, pathname: string, reqType: string, bodyType: string, request: CommonRequest, runtime: Util.RuntimeOptions): object {
  __request.protocol = Util.defaultString(@protocol, protocol);
  __request.method = method;
  __request.pathname = pathname;
  __request.headers = {
    host = @endpoint,
    accept = 'application/json',
    ...request.headers
  };

  if (!Util.isUnset(request.body)) {
    if (Util.equalString(reqType, 'formData')) {
      __request.body = request.body;
      __request.headers.content-type = 'application/x-www-form-urlencoded';
    } else {
      __request.body = request.body;
      __request.headers.content-type = 'application/json; charset=utf-8';
    }
  }

  if (!Util.isUnset(request.query)) {
    __request.query = request.query;
  }
} returns {
  if (Util.equalNumber(__response.statusCode, 204)) {
    return {
      headers = __response.headers
    };
  }

  if (Util.is4xx(__response.statusCode) || Util.is5xx(__response.statusCode)) {
    var _res = Util.readAsJSON(__response.body);
    var err = Util.assertAsMap(_res);
    throw {
      code = err.code,
      message = err.message,
      data = err,
    };
  }
  if (Util.equalString(bodyType, 'binary')) {
    var resp = {
      body = __response.body,
      headers = __response.headers
    };
    return resp;
  } else if (Util.equalString(bodyType, 'byte')) {
    var byt = Util.readAsBytes(__response.body);
    return {
      body = byt,
      headers = __response.headers
    };
  } else if (Util.equalString(bodyType, 'string')) {
    var str = Util.readAsString(__response.body);
    return {
      body = str,
      headers = __response.headers
    };
  } else if (Util.equalString(bodyType, 'json')){
    var obj = Util.readAsJSON(__response.body);
    var res = Util.assertAsMap(obj);
    return {
      body = res,
      headers = __response.headers
    };
  } else {
    return {
      headers = __response.headers
    };
  }
} runtime {
  timeouted = 'retry',
  readTimeout = Util.defaultNumber(runtime.readTimeout, @readTimeout),
  connectTimeout = Util.defaultNumber(runtime.connectTimeout, @connectTimeout),
  httpProxy = Util.defaultString(runtime.httpProxy, @httpProxy),
  httpsProxy = Util.defaultString(runtime.httpsProxy, @httpsProxy),
  noProxy = Util.defaultString(runtime.noProxy, @noProxy),
  maxIdleConns = Util.defaultNumber(runtime.maxIdleConns, @maxIdleConns),
  retry = {
    retryable = runtime.autoretry,
    maxAttempts = Util.defaultNumber(runtime.maxAttempts, 3)
  },
  backoff = {
    policy = Util.defaultString(runtime.backoffPolicy, 'no'),
    period = Util.defaultNumber(runtime.backoffPeriod, 1)
  },
  ignoreSSL = runtime.ignoreSSL,
  key = @key,
  cert = @cert
}\n`);
    this.emitDefinitions(this.meta.definitions || []);
    Object.keys(this.meta.paths).forEach((urlPath) => {
      const methods = this.meta.paths[urlPath];
      this.commonParams = methods.parameters || [];
      Object.keys(methods).forEach((httpMethod) => {
        if (httpMethod === 'parameters') {
          return;
        }
        const api = methods[httpMethod];
        if (!api.operationId) {
          throw new Error(`The api(${httpMethod} ${urlPath}) don't has operationId`);
        }
        if (uniqueApiName[api.operationId]) {
          throw new Error(`The api(${api.operationId} ${urlPath}) has been redefinded`);
        }
        uniqueApiName[api.operationId] = true;
        try {
          const method = httpMethod.toUpperCase();
          var protocol = _protocol(this.meta.schemes || api.schemes);
          const apiName = api.operationId;
          const parameters = this.commonParams.concat(api.parameters || []);
          const query = parameters.filter((item) => {
            return item.in === 'query';
          });

          const body = parameters.filter((item) => {
            return item.in === 'body';
          });

          const formData = parameters.filter((item) => {
            return item.in === 'formData';
          });

          const pathParams = parameters.filter((item) => {
            return item.in === 'path';
          });

          const pathParameters = pathParams || [];

          this.emit(`model ${_modelName(apiName)}Request {\n`, 0);
          this.emit(`header?: map[string]string(name='header'),\n`, 1);
          parameters.forEach(p => {
            if (p.in === 'path') {
              return;
            }
            this.emit(`${_prettify(p.name)}${p.required ? '' : '?'}: `, 1);
            this.emitType(p, 2);
            this.emit(`(name='${p.name}'),\n`);
          });
          this.emit(`}\n`, 0);
          this.emit('\n');

          const response = api.responses['200'] || api.responses['201'];
          this.emit(`model ${_modelName(apiName)}Response {\n`, 0);
          this.emit(`headers: map[string]string(name='header'),\n`, 1);
          if (!response) {
            this.emit('');
          } else if (response.schema.type === 'array'){
            let ref =  response.schema.items['$ref'];
            let refName = ref.replace('#/definitions/', '');
            this.emit(`body: `, 1);
            if (this.extendsType[_modelName(refName)]) {
              this.emit(`[ ${_type(this.extendsType[_modelName(refName)])} ]`);
            } else {
              this.emit(`[ ${_modelName(refName)} ]`);
            }
            this.emit(`(name='body')\n`);
          } else if (response.schema.type && _isBasicType(response.schema.type)){
            this.emit(`body: ${_type(response.schema.format || response.schema.type)}(name='body'),\n`, 1);
          } else if (response.schema.$ref) {
            let ref =  response.schema['$ref'];
            let refName = ref.replace('#/definitions/', '');
            this.emit(`body: `, 1);
            if (this.extendsType[_modelName(refName)]) {
              this.emit(`${_type(this.extendsType[_modelName(refName)])} `);
            } else {
              this.emit(`${_modelName(refName)} `);
            }
            this.emit(`(name='body')\n`);
          }
          this.emit(`}\n`, 0);
          this.emit('\n');
          if (api.description) {
            this.emit(`/**\n`, 0);
            this.emit(` * ${api.description}\n`, 0);
            if (api.tags && api.tags.length > 0) {
              this.emit(` * @tags ${api.tags.join(', ')}\n`, 0);
            }
            this.emit(` */\n`, 0);
          }
          this.emit(`async function ${_upperFirst(apiName)}(`, 0);
          var hasParameter = false;
          for (let i = 0; i < pathParameters.length; i++) {
            if (i !== 0) {
              this.emit(', ');
            }
            hasParameter = true;
            this.emit(`${_prettify(pathParameters[i].name)}: string`);
          }

          if (hasParameter) {
            hasParameter = false;
            this.emit(', ');
          }
          this.emit(`request: ${_modelName(apiName)}Request): ${_modelName(apiName)}Response {\n`);
          this.emit(`var runtime = new Util.RuntimeOptions{};\n`, 1);
          this.emit(`return ${_upperFirst(apiName)}WithOptions(`, 1);
          for (let i = 0; i < pathParameters.length; i++) {
            if (i !== 0) {
              this.emit(', ');
            }
            hasParameter = true;
            this.emit(`${_prettify(pathParameters[i].name)}`);
          }

          if (hasParameter) {
            hasParameter = false;
            this.emit(', ');
          }
          this.emit(`request, runtime);\n`);
          this.emit(`}\n`);
          this.emit(`\n`);
          this.emit(`async function ${_upperFirst(apiName)}WithOptions(`, 0);
          for (let i = 0; i < pathParameters.length; i++) {
            if (i !== 0) {
              this.emit(', ');
            }
            hasParameter = true;
            this.emit(`${_prettify(pathParameters[i].name)}: string`);
          }

          if (hasParameter) {
            hasParameter = false;
            this.emit(', ');
          }
          this.emit(`request: ${_modelName(apiName)}Request, `);
          this.emit(`runtime: Util.RuntimeOptions): ${_modelName(apiName)}Response {\n`);
          this.emit(`Util.validateModel(request);\n`, 1);
          if (query && query.length > 0) {
            this.emit(`var query : map[string]any= {\n`, 1);
            query.forEach((item) => {
              let name = item.name;
              this.emit(`${name} = request.${_prettify(name)},\n`, 2);
            });
            this.emit(`};\n`, 1);
          }
          if (body && body.length > 1) {
            this.emit(`var body : map[string]any= {\n`, 1);
            body.forEach(item => {
              let name = item.name;
              this.emit(`${name} = request.${_prettify(name)},\n`, 2);
            });
            this.emit(`};\n`, 1);
          }

          if (formData && formData.length > 1) {
            this.emit(`var body : map[string]any= {\n`, 1);
            formData.forEach(item => {
              let name = item.name;
              this.emit(`${name} = request.${_prettify(name)},\n`, 2);
            });
            this.emit(`};\n`, 1);
          }
          this.emit(`var req = new CommonRequest{ \n`, 1);
          if (query && query.length > 0) {
            this.emit(`query = Util.stringifyMapValue(query),\n`, 2);
          }
          if (body && body.length === 1) {
            this.emit(`body = Util.toJSONString(request.body),\n`, 2);
          } else if (body && body.length > 1){
            this.emit(`body = Util.toJSONString(body),\n`, 2);
          } else if (formData && formData.length > 1){
            this.emit(`body = Util.toFormString(body),\n`, 2);
          }
          this.emit(`};\n`, 1);
          this.emit(`return doRequest('${apiName}', '${protocol.toUpperCase()}', '${method}', `, 1);
          const replaced = urlPath.replace(/\{/g, '${', -1);
          this.emit(`\`${this.meta.basePath}${replaced}\`,`);
          if (formData && formData.length > 1) {
            this.emit(` 'formData',`);
          } else {
            this.emit(` 'None',`);
          }
          if (!response) {
            this.emit(` 'none', req, runtime);\n`);
          } else if (response.schema.type) {
            this.emit(` '${response.schema.type}', req, runtime);\n`);
          } else {
            this.emit(` 'json', req, runtime);\n`);
          }
          this.emit('}\n');
          this.emit('\n');
        } catch(ex) {
          console.log(`Process ${api.operationId} ${httpMethod}: ${urlPath} failed.`);
          throw ex;
        }
      });
      
    });
  }
}

module.exports = function (meta) {
  const converter = new SwaggerConverter(meta);
  converter.convert();
  return converter.output;
};
