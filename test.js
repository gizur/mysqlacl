//
// First make sure there is a user to test with:
//
//     create database mysqlacl;
//     create user 'mysqlacl'@'localhost';
//     grant all privileges on mysqlacl.* to 'mysqlacl'@'localhost' with grant option;
//

var assert = require('assert');
var Acl = require('./mysqlacl.js');

var log = console.log.bind(console);

log('No assertion errors means that the tests did not find any errors!');

var options = {
  host: 'localhost',
  user: 'mysqlacl',
  password: 'mysqlacl',
  parseChar: '/'
  //  database : process.env.ADMIN_USER,
};

var a = new Acl('bucket_perms', options);

a.runQuery_('drop table mysqlacl.bucket_perms')
  .then(function () {
    return a.init();
  })
  .then(function () {
    return a.grant('mytable', ['get', 'post', 'put', 'delete'], 'pelle');
  })
  .then(function (res) {
    return a.isAllowed('mytable', 'get', 'pelle');
  })
  .then(function (res) {
    assert(res, 'isAllowed that should succeed');
    return a.isAllowed('mytable/subfolder/subfolder', 'get', 'pelle');
  })
  .then(function (res) {
    assert(res, 'isAllowed that should succeed');
    return a.isAllowed('mytable', 'get', 'kalle');
  })
  .then(function (res) {
    assert(!res, 'isAllowed that not should succeed');
    return a.revoke('mytable', ['get'], 'pelle');
  })
  .then(function (res) {
    return a.isAllowed('mytable', 'get', 'pelle');
  })
  .then(function (res) {
    assert(!res, 'isAllowed that not should succeed');
    return true;
  })
  .then(log, log);
