var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

/* GET test listing. */
router.get('/', function (req, res, next) {
  let data = '';

  const baseLanguages = ['en', 'tr'];
  const basePath = path.join(__dirname, '/../jsons');

  /**
   * It takes a path and an object, and recursively reads all the files in the path, adding them to the
   * object
   * @param path - The path to the directory you want to read.
   * @param [obj] - The object that will be returned.
   * @returns An object with the file paths as keys and the file contents as values.
   */
  const run = (path, obj = {}) => {
    const files = fs.readdirSync(path);

    files.forEach(function (file) {
      const _path = `${path}/${file}`;
      const isDirectory = fs.lstatSync(_path).isDirectory();
      if (isDirectory) {
        run(_path, obj);
      } else {
        obj[_path.replace(basePath, '')] = JSON.parse(fs.readFileSync(_path, 'utf8'));
      }
    });
    return obj;
  };

  /**
   * It takes two objects and returns a new object with the keys and values that are different between
   * the two objects
   * @param object1 - The first object to compare.
   * @param object2 - The object that you want to compare against.
   * @returns the difference between two objects.
   */
  const recusiveComparer = (object1, object2) => {
    const a = {};
    if (!(typeof object1 === 'object')) {
      if (!object2) {
        return object1;
      }
      return;
    }
    for (const key in object1) {
      if (!object2[key]) {
        a[key] = object1[key];
      } else {
        const value = recusiveComparer(object1[key], object2[key]);
        if (value) {
          a[key] = value;
          if (typeof value === 'object' && Object.keys(value).length === 0) {
            delete a[key];
          }
        }
      }
    }
    return a;
  };

  const rawDatas = run(basePath);

  /* Comparing all the files in the jsons folder and comparing them to each other. */
  Object.keys(rawDatas).forEach((key) => {
    baseLanguages.forEach((language) => {
      if (key.includes(`/${language}/`)) {
        const baseObj1 = rawDatas[key];
        baseLanguages.forEach((compareLanguage) => {
          if (compareLanguage != language) {
            const baseObj2 = rawDatas[key.replace(`/${language}/`, `/${compareLanguage}/`)];
            const result = recusiveComparer(baseObj1, baseObj2);
            data += `<h1>File Name: ${key} Language: ${language} -> ${compareLanguage}</h1>\n`;
            data += `<pre>${JSON.stringify(result)}</pre>\n`;
          }
        });
      }
    });
  });

  res.send(data);
});

module.exports = router;
