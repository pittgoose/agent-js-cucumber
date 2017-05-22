# agent-js-cucumber

0. <b>Clone <code>git@git.epam.com:dzianis_shlychkou/agent-js-cucumber.git</code> into <code>${your dir}</code><br/>
   from root folder of ${your project with tests}<br />
   <code>npm install file:${your dir}/agent-js-cucumber --save </code></b><br/>

1. <b>Make sure that you required glue code correctly. It is important to make Cucumber see support code.</b><br/>
   <p>For example:</p><br/>
   Let's say you have project structure like this below
   <code>
   my-project
    L features
        L step_definitions
            L angularjs
                L steps.js
                    L support
                        L handlers.js
                        L timeouts.js
                        L world.js
        L reportportal.js
        L package.json
    </code><br/>
    <p>your Protractor config should have the following code</p>
    <code>
    cucumberOpts: {
        require: 'features/step_definitions/**/*.js',
        tags: false,
        format: 'pretty',
        profile: false,
        'no-source': true
    },
    specs: ['features/*.feature'],
    </code><br/>

2. <b>Create Report Portal Configuration</b><br/>
   <b>For example in ./reportportal.js</b><br/>

   <b>In example blow ${text} - is used as placeholder for your data. This data you shold get from ReportPortal profile.</b><br/>

   <code>
   module.exports = {
        token: ${rp.token},
        endpoint: ${rp.endpoint}/api/v1,
        launch: ${rp.launch},
        project: ${rp.your_project},
        mode: "DEFAULT",
        description: ${description for the launch},
        takeScreenshot: "onFailure"
    };
    </code>
    takeScreenshot - if this option is defined then framework will take screenshot with protractor API if step has failed<br/>

3. <b>Import Report Portal handlers into /features/step_definitions/support/handlers.js as code below</b><code>
    const {CucumberReportPortalHandler} = require('agent-js-cucumber');
    const reportportal = require('../../../reportportal');
    var {defineSupportCode} = require('cucumber');
    defineSupportCode(consumer => CucumberReportPortalHandler(reportportal).bind(consumer).call());
</code>

4. <b>Import World for logging into /features/step_definitions/support/world.js</b><br/>
   
    <code>
    let {defineSupportCode} = require('cucumber');
    let {ProtractorCucumberWorld} = require('agent-js-cucumber');
    defineSupportCode(consumer => consumer.setWorldConstructor(ProtractorCucumberWorld(consumer).call()));
    </code><br/>
    It will allow you  send logs and screenshots to RP directly step definitions<br/>

    <p>For Example:</p><br/>

    <code>
    Then(/^I should see my new task in the list$/, function (callback) {
        this.info("This is Info Level log");
        this.debug("This is Debug Level log");
        this.error("This is Error Level log");
        this.warn("This is Warn Level log");
        this.screenshot("This screenshot").then(() => callback());
    });
    </code><br/>

    screenshot function return promise fulfilled after screenshot is taken and image added to attachments.<br/>
    Handler will parse attachments and send corresponding log to the step item.<br/>