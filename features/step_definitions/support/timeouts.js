// var configure = function () {
//   this.setDefaultTimeout(60 * 1000);
// };

// module.exports = configure;

var {defineSupportCode} = require('cucumber');

defineSupportCode(function({setDefaultTimeout}) {
  setDefaultTimeout(60 * 1000);
});