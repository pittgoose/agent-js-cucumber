const ReportPortalClient = require('reportportal-client');
const Path = require('path');

module.exports = (config) => {

    getJSON = (json) => {
        try {
            let jsonObject = JSON.parse(json);
            if (jsonObject && typeof jsonObject === "object") {
                return jsonObject;
            }
        }
        catch (error) {}
        return false;
    }

    getTags = tags => tags.map(tag => tag.getName());
    getUri = uri => uri.replace(process.cwd() + Path.sep, '');
    cleanContext = () => {
        return {
            outlineRow: 0,
            scenarioStatus: 'failed',
            forcedIssue: null,
            featureId: null,
            scenarioId: null,
            stepId: null,
            stepStatus: 'failed',
            launchId: null,
            failedScenarios: 0,
            lastScenarioDescription: null
        };
    };

    let reportportal = new ReportPortalClient(config);
    let context = cleanContext();

    reportPortalHandlers = function() {
        this.registerHandler('BeforeFeatures', (event, callback) => {
            reportportal.startLaunch({
                name: config.launch,
                start_time: reportportal._now(),
                description: !config.description ? "" : config.description,
                tags: !config.tags ? [] : config.tags
            }).then(id => {
                context.launchId = id.id;
                callback();
            })
            .catch(err =>  { 
                console.log('Failed to start launch due to error', config.launch, err);
                callback();
            })
        });
        this.registerHandler('BeforeFeature', (event, callback) => {
            let description = event.description ? reportportal._formatName(event.description) : featureUri;
            let featureUri = getUri(event.uri);
            let name = event.name;
            reportportal.startTestItem({
                name: reportportal._formatName(name),
                launch_id: context.launchId,
                start_time: reportportal._now(),
                type: "SUITE",
                description: description,
                tags: getTags(event.tags)
            })
            .then(id => {
                context.featureId = id.id;
                callback();
            }).catch(err => {
                console.log("Error occured on starting feature", err);
                callback();
            });
        });
        this.registerHandler('BeforeScenario', (event, callback) => {
            let keyword = event.keyword;
            let name = [keyword, event.name].join(': ');

            let description = [getUri(event.uri), event.line].join(':');
            if (context.lastScenarioDescription !== name) {
                context.lastScenarioDescription = name;
                context.outlineRow = 0;
            }else{
                context.outlineRow ++;
                name += ' [' + context.outlineRow + ']';
            }

            reportportal.startTestItem({
                name: reportportal._formatName(name),
                launch_id: context.launchId,
                start_time: reportportal._now(),
                type: "TEST",
                description: description
            }, context.featureId)
            .then(testId => {
                context.scenarioId = testId.id;
                callback();
            }).catch(err => {
                console.log("Error occured on starting scenario", err);
                callback();
            });
        });
        this.registerHandler('BeforeStep', (event, callback) => {
            let args = [];
            if(event.arguments && event.arguments.length){
                event.arguments.forEach(arg => {
                    if(arg.constructor.name === 'DocString'){
                        args.push(arg.content);
                    }else if(arg.constructor.name === 'DataTable'){
                        arg.rawTable.map(row => row.join('|').trim()).forEach(line => {
                            args.push("|" + line + "|");
                        });
                    }
                })
            }
            let name = event.name ? reportportal._formatName(`${event.keyword} ${event.name}`) : reportportal._formatName(event.keyword);
            reportportal.startTestItem({
                name: name,
                launch_id: context.launchId,
                start_time: reportportal._now(),
                type: "STEP",
                description: args.length ? args.join("\n").trim() : ""
            }, context.scenarioId)
            .then(stepId => {
                context.stepId = stepId.id;
                callback();
            }).catch(err => {
                console.log("Error occured on starting step", err);
                callback();
            });
        });
        this.registerHandler('StepResult', (event, callback) => {
            let sceenshotName = !event.stepDefinition ? 'UNDEFINED STEP' : `Failed at step definition line:${event.stepDefinition.line}`;
            if(event.attachments && event.attachments.length && (event.status === 'passed' || event.status === 'failed' )){
                event.attachments.forEach(attachment => {
                    switch(attachment.mimeType){
                        case 'text/plain': {
                            let logMessage = getJSON(attachment.data);
                            let request = {
                                item_id: context.stepId,
                                time: reportportal._now()
                            };
                            if(logMessage){
                                request.level = logMessage.level;
                                request.message = logMessage.message;
                            }else{
                                request.level = "DEBUG";
                                request.message = attachment.data;
                            }
                            reportportal.log(request)
                            .catch(err => {
                                console.log(err);
                            })
                            break;
                        }
                        case 'image/png': {
                            let request = {
                                item_id: context.stepId,
                                time: reportportal._now(),
                                level:  context.stepStatus === 'passed' ? "DEBUG" : "ERROR"
                            };
                            let pngObj = getJSON(attachment.data);
                            if(pngObj){
                                request.file = { name: pngObj.message };
                                request.message = pngObj.message;
                                reportportal.sendFile([request], pngObj.message,  pngObj.data, "image/png");
                            }else{
                                request.file = { name: sceenshotName };
                                request.message = sceenshotName;
                                reportportal.sendFile([request], sceenshotName,  attachment.data, "image/png");
                            }
                            break;
                        }
                    }
                });
            }
            switch(event.status){
                case 'passed': {
                    context.stepStatus = 'passed';
                    context.scenarioStatus = 'passed';
                    callback();
                    break;
                }
                case 'pending': {
                    reportportal.log({
                        item_id: context.stepId,
                        time: reportportal._now(),
                        level: "WARN",
                        message: "This step is marked as 'pending'"
                    });
                    context.stepStatus = 'not_implemented';
                    context.scenarioStatus = 'failed';
                    context.failedScenarios++;
                    callback();
                    break;
                }
                case 'undefined':{
                    reportportal.log({
                        item_id: context.stepId,
                        time: reportportal._now(),
                        level: "ERROR",
                        message: "There is no step definition found. Please verify and implement it."
                    });
                    context.stepStatus = 'not_found';
                    context.scenarioStatus = 'failed';
                    context.failedScenarios++;
                    callback();
                    break;
                }
                case 'skipped': {
                    context.stepStatus = 'skipped';
                    if(context.scenarioStatus === 'failed'){
                        context.scenarioStatus = 'skipped';
                    }
                    callback();
                    break;
                }
                case 'failed': {
                    context.stepStatus = 'failed';
                    context.failedScenarios++;
                    let errorMessage = `${event.stepDefinition.uri}\n${JSON.stringify(event.failureException)}`;
                    reportportal.log({
                        item_id: context.stepId,
                        time: reportportal._now(),
                        level: "ERROR",
                        message: errorMessage
                    })
                    .then(result => {
                        if(browser && config.takeScreenshot && config.takeScreenshot === 'onFailure'){
                            browser.takeScreenshot()
                            .then(png => {
                                reportportal.sendFile([
                                    {
                                        item_id: context.stepId,
                                        time: reportportal._now(),
                                        level:  "ERROR",
                                        file: { name: sceenshotName },
                                        message: sceenshotName
                                    }], sceenshotName,  png, "image/png")
                            })
                            .catch(error => {
                                callback();
                            })
                            .then(result =>{
                                callback();
                            });
                        }
                        else{
                            callback();
                        }
                    });
                    break;
                } 
            };
        });
        this.registerHandler('AfterStep', (event, callback) => {
            let request = {      
                status: context.stepStatus,
                end_time: reportportal._now()
            }
            if('not_found' === request.status){
                request.status = 'failed';
                request.issue = {
                    issue_type: 'AUTOMATION_BUG', comment: "STEP DEFINITION WAS NOT FOUND"
                }
            }
            else if('not_implemented' === request.status){
                request.status = 'skipped';
                request.issue = {
                    issue_type: 'TO_INVESTIGATE', comment: "STEP IS PENDING IMPLEMENTATION"
                }
            }
            reportportal.finishTestItem(context.stepId, request)
            .then(result => {
                context.stepStatus = 'failed';
                context.stepId = null;
                callback();
            })
            .catch(err => {
                console.log("Error occured on finishing step", err);
                callback();
            });
        });
        this.registerHandler('ScenarioResult', (event, callback) => {
            reportportal.finishTestItem(context.scenarioId, {
                status: event.status !== 'PASSED' ? 'failed' : 'passed',
                end_time: reportportal._now()
            })
            .then(reuslt => {
                context.scenarioStatus = 'failed';
                context.scenarioId = null;
                callback();
            })
            .catch(err => {
                console.log("Error occured when finishing scenario", err);
                callback();
            });
        });
        this.registerHandler('AfterFeature', (event, callback) => {
            let featureStatus = context.failedScenarios > 0 ? 'failed' : 'passed';            
            reportportal.finishTestItem(context.featureId, {
                status: featureStatus,
                end_time: reportportal._now()
            })
            .then(reuslt => {     
                callback();
            })
            .catch(err => {
                console.log("Error occured when finishing feature", err);    
                callback();
            });
        });
        this.registerHandler('AfterFeatures', (event, callback) => {
            if(!context.launchId){
                console.log("Failed to finish test launch - launchId is not defined");
                callback();
            }
            reportportal.finishLaunch(context.launchId, {
                end_time: reportportal._now()
            })
            .then(result => callback())
            .catch(err => {
                console.log("Error occured dring finishing launch", err);
                context = cleanContext();
                callback();
            });
        });
    }
    return reportPortalHandlers;
};