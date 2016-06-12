Access Control Lists with MySql backend
=======================================

ACL implementation similar to [jsonacl](https://github.com/gizur/jsonacl)
but with MySQL as the backend.

It is now possible to use objects like this. `bucket/folder`. The part after
the `/` can be ignored using `options.parseChar`.

See `test.js` for details on how to use the library.

Run tests:

1. `npm install`
2. `node test.js`
