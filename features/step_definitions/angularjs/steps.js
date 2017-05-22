var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

var {defineSupportCode} = require('cucumber');
defineSupportCode(({Given, When, Then}) =>{

Given(/^I go to "([^"]*)"$/, function(site, callback) {

    browser.get(site).then(r => {
    
     callback();
    });
    
  });

  When(/^I add "([^"]*)" in the task field$/, function (task) {
    
  });

  When(/^I click the add button$/, () => {
    
  });

  Then(/^I should see my new task in the list$/, function () {
  });

  Then(/^I should receive an email with/, function (text, callback){
   
    //callback(null, 'pending');
    callback();
  })
  Then(/^i see:/, function (table, callback) {
    expect(5).equal(10);
    callback();   
  })

});

