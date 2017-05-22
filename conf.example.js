module.exports.config = {

    framework: 'custom',
    frameworkPath: require.resolve('protractor-cucumber-framework'),
    seleniumAddress: 'http://127.0.0.1:4444/wd/hub',
    getPageTimeout: 60000,
    allScriptsTimeout: 90000,
    capabilities: {
        'browserName': 'chrome',
        'shardTestFiles': true,
        'maxInstances': 1
    },

    onPrepare: function() {
        global.defaultExplicitWait = 5000;
    },

    specs: ['features/*.feature'],

    cucumberOpts: {
        require: 'features/step_definitions/**/*.js',
        tags: false,
        format: 'pretty',
        profile: false,
        'no-source': true
    }
};
