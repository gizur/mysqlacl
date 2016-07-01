//
// table for permissions:
//
//  * object - varchar(255)
//  * verb - varchar(255)
//  * role - varchar(255)
//
//  var options = {
//    host: 'localhost',
//    user: process.env.ADMIN_USER,
//    password: process.env.ADMIN_PASSWORD,
//    //  database : process.env.ADMIN_USER,
//  };


var util = require('util');
var mysql = require('mysql');

var log = console.log.bind(console);
var error = console.log.bind(console, 'ERROR');
var debug = console.log.bind(console, 'DEBUG');

Acl = function (table, options) {
  if (!table || !options) throw new Error('table and options are mandatory');

  this.table = table;
  this.options = options;

  this.options.connectFromHost = this.options.connectFromHost || 'localhost';
};

Acl.prototype.init = function () {
  return this.createPermTable_();
};

Acl.prototype.createPermTable_ = function () {
  var sql = "create table if not exists " + this.options.user + "." + this.table +
    " (object varchar(255) not null, verb varchar(255) not null, role varchar(255) not null)";

  return this.runQuery_(sql);
};

Acl.prototype.dropPermTable = function () {
  var sql = util.format("drop table %s.%s;", this.options.user, this.table);

  return this.runQuery_(sql);
};

Acl.prototype.runQuery_ = function (sql) {
  var self = this;

  return new Promise(function (fullfil, reject) {
    debug(sql);
    var conn = mysql.createConnection(self.options);
    conn.connect();

    var res = [];
    var query = conn.query(sql);
    query
      .on('error', function (err) {
        error(err);
        reject(err);
      })
      .on('result', function (row) {
        res.push(row);
      })
      .on('end', function () {
        fullfil(res);
        conn.end();
      });
  });
};

Acl.prototype.isAllowed = function (object, verb, role, accountId) {
  var schema = accountId || this.options.user;

  if(this.options.parseChar) {
    object = object.split(this.options.parseChar)[0];
  }

  var sql = util.format("select object, verb, role from %s.%s where (object='%s' or object='*') and (verb='%s' or verb='*') and (role='%s' or role='*')",
    schema, this.table, object, verb, role);

  return this.runQuery_(sql)
    .then(function (res) {
      return res.length > 0;
    });
};


// returns true if successful and false otherwise
Acl.prototype.grant = function (object, verbs, role, roleIsDbUser) {
  var sql = util.format("insert into %s.%s values", this.options.user, this.table);

  verbs.forEach(function (verb, i) {
    if (i) sql += ",";
    sql += util.format("('%s','%s','%s')", object, verb, role);
  });

  return this.runQuery_(sql).then(function(){
    if(roleIsDbUser && this.options.user !== role && role !== '*') {
      var sql = util.format("grant select on %s.%s to '%s'@'%s';",
                            this.options.user,
                            this.table,
                            role,
                            this.options.connectFromHost);
                            
      return this.runQuery_(sql);
    }

  });
};

// returns true if successful and false otherwise
Acl.prototype.revoke = function (object, verbs, role) {
  var where = "(";
  verbs.forEach(function (verb, i) {
    if (i) where += " or ";
    where += util.format("verb='%s'", verb);
  });
  where += ")";

  var sql = util.format("delete from %s.%s where object='%s' and %s and role='%s'",
    this.options.user, this.table, object, where, role);

  return this.runQuery_(sql)
};

module.exports = Acl;
