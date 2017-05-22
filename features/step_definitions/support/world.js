let {defineSupportCode} = require('cucumber');
let {ProtractorCucumberWorld} = require('agent-js-cucumber');
defineSupportCode(consumer => consumer.setWorldConstructor(ProtractorCucumberWorld(consumer).call()));