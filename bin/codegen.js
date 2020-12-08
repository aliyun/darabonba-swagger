'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { _upperFirst } = require('../lib/helper');

const [ metaPath, outputDir ] = process.argv.slice(2);

var metaText = fs.readFileSync(metaPath, 'utf8');
var meta = {};
if (metaPath.endsWith('.yml')) {
  meta = yaml.safeLoad(metaText);
} else {
  meta = JSON.parse(metaText);
}

const res = require('../lib/swagger')(meta);
var tmp = fs.readFileSync(path.join(__dirname, '../template/Teafile'), 'utf8');
const product = meta.info.title;
tmp = tmp.replace(/{{productId}}/g, product);
tmp = tmp.replace(/{{lowerCaseId}}/g, product.toLowerCase());
tmp = tmp.replace(/{{pureLowerCaseId}}/g, product.toLowerCase().replace(/-/g, '_'));
tmp = tmp.replace(/{{pureUpperCamlId}}/g, _upperFirst(product).replace(/-/g, '_'));
tmp = tmp.replace(/{{upperCamlId}}/g, _upperFirst(product));
tmp = tmp.replace(/{{upperFirstPureProductId}}/g, _upperFirst(product.split('-').join('')));
const teafilePath = path.join(outputDir || './', 'Teafile');
const teafileExist = fs.existsSync(teafilePath);
if (teafileExist) {
  const teafileContent = fs.readFileSync(teafilePath, 'utf-8');
  const teafileJson = JSON.parse(teafileContent);
  const jsonObj = JSON.parse(tmp);
  Object.keys(jsonObj.releases).forEach(lang => {
    if (!teafileJson.releases[lang]) {
      teafileJson.releases[lang] = jsonObj.releases[lang];
    }
  });
  jsonObj.releases = teafileJson.releases;
  jsonObj.version = teafileJson.version;
  if (teafileJson.php) {
    jsonObj.php = teafileJson.php;
  }
  tmp = JSON.stringify(jsonObj, null, '\t');
}

fs.writeFileSync(teafilePath, tmp);
fs.writeFileSync(path.join(outputDir || './', 'main.tea'), res);