const {CucumberReportPortalHandler} = require('agent-js-cucumber');
const reportportal = require('../../../reportportal');

//2.0
var {defineSupportCode} = require('cucumber');
defineSupportCode(consumer => CucumberReportPortalHandler(reportportal).bind(consumer).call());

// //1.3.x
// // CucumberReportPortalHandler.bind(this)
// // module.exports = CucumberReportPortalHandler;