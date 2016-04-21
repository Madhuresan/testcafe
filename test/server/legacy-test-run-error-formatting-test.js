var expect                               = require('chai').expect;
var read                                 = require('read-file-relative').readSync;
var remove                               = require('lodash').pull;
var ReporterPluginHost                   = require('../../lib/reporter/plugin-host');
var TYPE                                 = require('../../lib/legacy/test-run-error/type');
var LegacyTestRunErrorFormattableAdapter = require('../../lib/legacy/test-run-error/formattable-adapter');


var untestedErrorTypes = Object.keys(TYPE).map(function (key) {
    return TYPE[key];
});

var userAgentMock = 'Chrome 15.0.874 / Mac OS X 10.8.1';

var reporterPluginMock = {
    createErrorDecorator: function () {
        var decorator = ReporterPluginHost.prototype.createErrorDecorator.call(this);

        decorator ['span category'] = function (str) {
            return 'CATEGORY=' + str + '\n';
        };

        return decorator;
    }
};

// Output stream and errorDecorator mocks
function createOutStreamMock () {
    return {
        data: '',

        write: function (text) {
            this.data += text;
        }
    };
}

function assertErrorMessage (file, err, callsite) {
    var screenshotPath = '/unix/path/with/<tag>';
    var outStreamMock  = createOutStreamMock();
    var plugin         = new ReporterPluginHost(reporterPluginMock, outStreamMock);

    var errAdapter = new LegacyTestRunErrorFormattableAdapter(err, {
        userAgent:      userAgentMock,
        screenshotPath: screenshotPath,
        callsite:       callsite
    });

    plugin
        .useWordWrap(true)
        .write(plugin.formatError(errAdapter));

    var expectedMsg = read('./data/expected-legacy-test-run-errors/' + file)
        .replace(/(\r\n)/gm, '\n')
        .trim();

    expect(outStreamMock.data).eql(expectedMsg);

    //NOTE: remove tested messages from list
    remove(untestedErrorTypes, err.type);
}

describe('Legacy error formatting', function () {
    describe('Assertions', function () {
        it('Should format "eq" assertion message', function () {
            var err = {
                stepName:  'Step with <tag>',
                expected:  '"<another-tag>"',
                actual:    '"<some-tag>"',
                key:       '<tag>',
                isObjects: true,
                type:      TYPE.eqAssertion,
                message:   '<tagged> message',
                diffType:  {
                    isStrings: true,
                    diffIndex: 1
                }
            };

            assertErrorMessage('eq-assertion', err, 'eq({"<tag>": "<some-tag>"}, {"<tag>": "<another-tag>"})');
        });

        it('Should format "notEq" assertion message', function () {
            var err = {
                stepName: 'Step with <tag>',
                actual:   '"<test>"',
                expected: '"<test>"',
                type:     TYPE.notEqAssertion,
                message:  '<tagged> message'
            };

            assertErrorMessage('not-eq-assertion', err, 'notEq("<test>", "<test>")');
        });

        it('Should format "ok" assertion message', function () {
            var err = {
                stepName: 'Step with <tag>',
                actual:   'false',
                type:     TYPE.okAssertion,
                message:  '<tagged> message'
            };

            assertErrorMessage('ok-assertion', err, 'ok("<test>" === "<best>")');
        });

        it('Should format "notOk" assertion message', function () {
            var err = {
                stepName: 'Step with <tag>',
                actual:   '"<test>"',
                type:     TYPE.notOkAssertion,
                message:  '<tagged> message'
            };

            assertErrorMessage('not-ok-assertion', err, 'notOk("<test>")');
        });
    });

    describe('Errors', function () {
        it('Should format "iframeLoadingTimeout" error message', function () {
            var err = {
                type: TYPE.iframeLoadingTimeout
            };

            assertErrorMessage('iframe-loading-timeout', err);
        });

        it('Should format "inIFrameTargetLoadingTimeout" error message', function () {
            var err = {
                type:     TYPE.inIFrameTargetLoadingTimeout,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('in-iframe-target-loading-timeout', err);
        });

        it('Should format "uncaughtJSError" error message', function () {
            var err = {
                type:        TYPE.uncaughtJSError,
                scriptErr:   'test-error-with-<tag>',
                pageDestUrl: 'http://page'
            };

            assertErrorMessage('uncaught-js-error', err);
        });

        it('Should format "uncaughtJSErrorInTestCodeStep" error message', function () {
            var err = {
                type:      TYPE.uncaughtJSErrorInTestCodeStep,
                stepName:  'Step with <tag>',
                scriptErr: 'error with <tag>'
            };

            assertErrorMessage('uncaught-js-error-in-test-code-step', err);
        });

        it('Should format "storeDomNodeOrJqueryObject" error message', function () {
            var err = {
                type:     TYPE.storeDomNodeOrJqueryObject,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('store-dom-node-or-jquery-object', err);
        });

        it('Should format "emptyFirstArgument" error message', function () {
            var err = {
                type:     TYPE.emptyFirstArgument,
                stepName: 'Step with <tag>',
                action:   'testAction'
            };

            assertErrorMessage('empty-first-argument', err, 'code and <tag>');
        });

        it('Should format "invisibleActionElement" error message', function () {
            var err = {
                type:     TYPE.invisibleActionElement,
                stepName: 'Step with <tag>',
                action:   'test-action',
                element:  '<element>'
            };

            assertErrorMessage('invisible-action-element', err, 'code and <tag>');
        });

        it('Should format "incorrectDraggingSecondArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectDraggingSecondArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-dragging-second-argument', err, 'code and <tag>');
        });

        it('Should format "incorrectPressActionArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectPressActionArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-press-action-argument', err, 'code and <tag>');
        });

        it('Should format "emptyTypeActionArgument" error message', function () {
            var err = {
                type:     TYPE.emptyTypeActionArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('empty-type-action-argument', err, 'code and <tag>');
        });

        it('Should format "unexpectedDialog" error message', function () {
            var err = {
                type:     TYPE.unexpectedDialog,
                stepName: 'Step with <tag>',
                dialog:   'test-dialog',
                message:  'message with <tag>'
            };

            assertErrorMessage('unexpected-dialog', err);
        });

        it('Should format "expectedDialogDoesntAppear" error message', function () {
            var err = {
                type:     TYPE.expectedDialogDoesntAppear,
                stepName: 'Step with <tag>',
                dialog:   'test-dialog'
            };

            assertErrorMessage('expected-dialog-doesnt-appear', err);
        });

        it('Should format "incorrectSelectActionArguments" error message', function () {
            var err = {
                type:     TYPE.incorrectSelectActionArguments,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-select-action-arguments', err, 'code and <tag>');
        });

        it('Should format "incorrectWaitActionMillisecondsArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectWaitActionMillisecondsArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-wait-action-milliseconds-arguments', err, 'code and <tag>');
        });

        it('Should format "incorrectWaitForActionEventArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectWaitForActionEventArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-wait-for-action-event-argument', err, 'code and <tag>');
        });

        it('Should format "incorrectWaitForActionTimeoutArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectWaitForActionTimeoutArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-wait-for-action-timeout-argument', err, 'code and <tag>');
        });

        it('Should format "waitForActionTimeoutExceeded" error message', function () {
            var err = {
                type:     TYPE.waitForActionTimeoutExceeded,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('wait-for-action-timeout-exceeded', err, 'act.waitFor(function(cb) {\n    $("<iframe>");\n    cb();\n}, 1000);');
        });

        it('Should format "emptyIFrameArgument" error message', function () {
            var err = {
                type:     TYPE.emptyIFrameArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('empty-iframe-argument', err);
        });

        it('Should format "iframeArgumentIsNotIFrame" error message', function () {
            var err = {
                type:     TYPE.iframeArgumentIsNotIFrame,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('iframe-argument-is-not-iframe', err);
        });

        it('Should format "multipleIFrameArgument" error message', function () {
            var err = {
                type:     TYPE.multipleIFrameArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('multiple-iframe-argument', err);
        });

        it('Should format "incorrectIFrameArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectIFrameArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-iframe-argument', err);
        });

        it('Should format "uploadCanNotFindFileToUpload" error message', function () {
            var err = {
                type:      TYPE.uploadCanNotFindFileToUpload,
                stepName:  'Step with <tag>',
                filePaths: ['/unix/path/with/<tag>', 'path2']
            };

            assertErrorMessage('upload-can-not-find-file-to-upload', err, 'code and <tag>');
        });

        it('Should format "uploadElementIsNotFileInput" error message', function () {
            var err = {
                type:     TYPE.uploadElementIsNotFileInput,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('upload-element-is-not-file-input', err, 'code and <tag>');
        });

        it('Should format "uploadInvalidFilePathArgument" error message', function () {
            var err = {
                type:     TYPE.uploadInvalidFilePathArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('upload-invalid-file-path-argument', err, 'code and <tag>');
        });

        it('Should format "pageNotLoaded" error message', function () {
            var err = {
                type:    TYPE.pageNotLoaded,
                message: 'Failed to find a DNS-record for the resource at <a href="example.org">example.org</a>.'
            };

            assertErrorMessage('page-not-loaded', err);
        });

        it('Should format "incorrectGlobalWaitForActionEventArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectGlobalWaitForActionEventArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-global-wait-for-action-event-argument', err);
        });

        it('Should format "incorrectGlobalWaitForActionTimeoutArgument" error message', function () {
            var err = {
                type:     TYPE.incorrectGlobalWaitForActionTimeoutArgument,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('incorrect-global-wait-for-action-timeout-argument', err);
        });

        it('Should format "globalWaitForActionTimeoutExceeded" error message', function () {
            var err = {
                type:     TYPE.globalWaitForActionTimeoutExceeded,
                stepName: 'Step with <tag>'
            };

            assertErrorMessage('global-wait-for-action-timeout-exceed', err);
        });
    });

    describe('Test coverage', function () {
        it('Should test messages for all error codes', function () {
            expect(untestedErrorTypes).to.be.empty;
        });
    });
});