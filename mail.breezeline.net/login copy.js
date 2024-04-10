/* jslint browser: true, regexp: true, plusplus: true */
/*global XIMSSSession: false, GibberishAES: false, basePathRef: false, $: false, require: false, useSMSAuth: false */
var sessionInstance,
    storedUserName,
    storedSid,
    storedLogInMethod,
    storedLogoutURL,
    storedSessionXML = null,
    userLang = __stringsLang,
    $isMobile = false,
    require = {
        waitSeconds: 50,
        urlArgs: "rand=${revision.number}",
        baseUrl: ".",
        es6: {
            fileExtension: ".js" // put in .jsx for JSX transformation
        },
        babel: {
            presets: [
                ["latest", {
                    "targets": {
                        "browsers": [">= 5%", "ie > 9", "firefox > 4", "safari > 5.1", "chrome", "edge"]
                    },
                    "debug": true,
                    "useBuiltIns": true
                }]
            ]
        },
        shim: {
            "log4javascript": {
                exports: "log4javascript"
            },
            "angular": {
                deps: ["underscore", "jquery", "jqueryScrollTo"],
                init: function init() {
                    "use strict";

                    if (_ !== undefined) {
                        _.noConflict();
                    }

                    if ($ !== undefined) {
                        $.noConflict();
                    }
                }
            },
            "angularAMD": ["angular"],
            "angularSanitize": {
                deps: ["angular"]
            },
            "mediapluginobj": {
                init: function init() {
                    "use strict";

                    return {
                        publicExports: publicExports
                    };
                },
                exports: "publicExports"
            },
            "jqueryScrollTo": {
                deps: ["jquery"]
            },
            "autoGrowInputPlugin": {
                deps: ["jquery"]
            },
            "redactor": {
                deps: ["jquery"]
            },
            "jqueryui": {
                deps: ["jquery"]
            },
            "fullCalendar": {
                deps: ["jquery", "jqueryui"]
            },
            "signals": {}
        },

        paths: {
            log: "pronto/logging/requre-log",
            loggingConfig: "pronto/logging/production-logging-conf",
            app: "pronto/core/initializer",
            version: "pronto/core/version",
            ximssclient: "pronto/session/production-ximssclient",
            vCardUtil: "pronto/util/vcard-util",
            XMPPUtil: "pronto/util/xmpp-util",
            DateUtil: "pronto/util/date-util",
            TextUtil: "pronto/util/text-util",
            requestBodyUtil: "pronto/util/request-body-util",
            PhotoUtil: "pronto/util/photo-util",
            contact: "pronto/shared/contact",
            mailbox: "pronto/shared/mailbox-manager/mailbox",
            mailboxAccount: "pronto/shared/mailbox-manager/mailbox-account",
            mailboxView: "pronto/shared/mailbox-manager/mailbox-view",
            folder: "pronto/shared/mailbox-manager/folder",
            message: "pronto/shared/mailbox-manager/message",
            dataset: "pronto/shared/datasets/dataset",
            datasetAddress: "pronto/shared/datasets/dataset-address",
            ls: "pronto/css/require-less-production",
            css: "pronto/css/require-css",
            prodModularity: "pronto/modularity/production-modularity",
            skinCss: "pronto/skinning/require-css-skinnable-production",
            customSkinCss: "custom-skin.ie.css",
            session: "pronto/session/session-service",
            sessionParamsProvider: "pronto/session/production-session-params-provider",
            initialLangProvider: "pronto/i18n/production-initial-lang-provider",
            logoutService: "pronto/session/production-logout-service",
            skinFileURLProvider: "pronto/util/production-skin-file-url-provider",
            fileStorage: "pronto/shared/files/filestorage",
            fileStoreObject: "pronto/shared/files/filestoreobject",
            autoGrowInputPlugin: "pronto/components/auto-grow-input/auto-grow-input-plugin",
            prontoUncaughtHandler: "pronto/logging/pronto-uncaught-handler",
            m: "pronto/mobile/require-mobile",
            es6: "pronto/core/es6",
            babel: "lib/babel",

            // Frameworks
            log4javascript: "pronto/production-log4javascript",
            jquery: "pronto/production-jquery",
            signal: "pronto/production-signals",
            jqueryScrollTo: "pronto/production-jquery-scroll-to",
            underscore: "pronto/production-underscore",
            text: "lib/require-text",
            angular: "pronto/production-angular",
            angularSanitize: "pronto/production-angular-sanitize",
            less: "pronto/production-less",
            redactor: "pronto/production-redactor",
            jqueryui: "pronto/production-jquery-ui",
            fullCalendar: "pronto/production-fullcalendar",
            mousetrapOrig: "pronto/production-mousetrap",
            mousetrap: "pronto/util/mousetrap-extend",
            jsZip: "pronto/production-jszip",
            // legacy libs
            crydigestmd5: "pronto/session/production-crydigestmd5",
            angularAMD: "lib/angular-amd",
            dompurify: "lib/purify",

            // webrtc
            mediapluginobj: "pronto/modules/dialer/lib/mediapluginobj",
            dialerSDPXML: "pronto/modules/dialer/lib/sdpxml",
            webRTCAdapter: "pronto/modules/dialer/lib/adapter",
            webrtcLog: "pronto/modules/dialer/lib/webRTC/webrtc-log",
            webrtcWrapper: "pronto/modules/dialer/lib/webRTC/webrtc-wrapper",

            modulesConfProvider: "pronto/modularity/production-modules-conf-provider"
        },
        stubModules: ["babel", "es6"],
        priority: ["log4javascript", "loggingConfig", "log", "less", "ximssclient", "jquery", "underscore", "angular", "SDPUtils", "webRTCWrapper"]
    };
(function() {
    'use strict';

    var changePasswordRequired = false,
        regureLoaded = false,
        requireLoading = false,
        requireCallback,
        parser = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        //less intuitive, more accurate to the specs
        querystring_parser = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g,
        // supports both ampersand and semicolon-delimted query string key/value pairs
        fragment_parser = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g,
        // supports both ampersand and semicolon-delimted fragment key/value pairs
        key = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
        // keys available to query
        parseUri = function parseUri(url) {
            var str = decodeURI(url),
                res = parser.exec(str),
                uri = {
                    attr: {},
                    param: {},
                    seg: {}
                },
                i = 14;

            while (i--) {
                uri.attr[key[i]] = res[i] || '';
            }

            // build query and fragment parameters
            uri.param.query = {};
            uri.param.fragment = {};

            uri.attr.query.replace(querystring_parser, function($0, $1, $2) {
                if ($1) {
                    uri.param.query[$1] = $2;
                }
            });

            uri.attr.fragment.replace(fragment_parser, function($0, $1, $2) {
                if ($1) {
                    uri.param.fragment[$1] = $2;
                }
            });

            // split path and fragement into segments
            uri.seg.path = uri.attr.path.replace(/^\/+|\/+$/g, '').split('/');
            uri.seg.fragment = uri.attr.fragment.replace(/^\/+|\/+$/g, '').split('/');

            // compile a 'base' domain attribute
            uri.attr.base = uri.attr.host ? uri.attr.protocol + '://' + uri.attr.host + (uri.attr.port ? ':' + uri.attr.port : '') : '';

            return uri;
        },
        url = window.location.toString().replace(/^(.*?\?)((.*?&)*?)((p-)?)(username=[^&]*?)@/gi, '$1$2$4$6%40'),
        data = parseUri(url),
        host = data.attr.host,
        checkButtonInterval,
        useExtraDomain = false,
        loginInput = $('.pronto-login__login'),
        passInput = $('.pronto-login__password'),
        smsInput = $('.pronto-login__sms'),
        setLocalItem = function setLocalItem(name, value) {
            try {
                localStorage.setItem(name, value);
            } catch (e) {}
        },
        getLocalItem = function getLocalItem(name) {
            try {
                var value = localStorage.getItem(name);
                return value;
            } catch (e) {
                return null;
            }
        },
        removeLocalItem = function removeLocalItem(name) {
            try {
                var value = localStorage.removeItem(name);
            } catch (e) {}
        },
        asyncPreserver = function asyncPreserver(xml) {
            // Just hack to override setUnknownAsyncProcessor handler
            if (typeof this.realAsyncProcessor !== 'undefined' && this.realAsyncProcessor !== null) {
                this.realAsyncProcessor(xml);
            }
            if (!sessionInstance.preservedAsync) {
                sessionInstance.preservedAsync = [xml];
            } else {
                sessionInstance.preservedAsync.push(xml);
            }
        },
        getErrorString = function getErrorString(str) {
            var string = 'Error';
            if (typeof __stringsXml === 'undefined') {
                return str;
            }
            try {
                var labelId = 'ErrorCodes.' + str,
                    query = labelId.split('.').map(function(part) {
                        return '[name="' + part + '"]';
                    }).join(' ');

                string = __stringsXml.querySelector(query);
                if (!string) {
                    return str;
                }
                if (string.nodeName === 'string') {
                    return string.textContent;
                }
            } catch (e) {
                string = str;
            }
            return string;
        },
        handleError = function handleError(error, sms) {
            if (sms) {
                $('.pronto-login-sms__start').show();
            } else {
                $('#pronto-login__start').show();
            }
            $('.pronto-login__siginingin').hide();
            if (error === 'server communication error') {
                error = 'cannot connect to the server';
            }
            $('.pronto-login__error-common').show().text(getErrorString(error));
            startCommon(true);
        },
        normalizeUsername = function normalizeUsername(uName) {
            if (uName.indexOf('@') > -1) {
                return uName;
            }
            return uName + '@' + host;
        },
        decryptCookie = function decryptCookie(data) {
            var keyCharAt = function keyCharAt(key, i) {
                    return key.charCodeAt(Math.floor(i % key.length));
                },
                xor_decrypt = function xor_decrypt(key, data) {
                    return data.map(function(c, i) {
                        return String.fromCharCode(c ^ keyCharAt(key, i));
                    }).join('');
                };
            return xor_decrypt('pronto', atob(data).split(','));
        },
        getCookie = function getCookie(cname) {
            var name = cname + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return null;
        },
        loginWithSms = function loginWithSms(uName, password) {
            $.ajax({
                url: data.attr.base + '/cgi-bin/smscheck1.pl',
                type: 'POST',
                data: {
                    username: normalizeUsername(uName),
                    password: password
                },
                dataType: 'text',
                success: function success(result) {
                    if (!result) {
                        handleError('unknown error');
                    }
                    if ($.trim(result) === 'OK') {
                        $('.pronto-login-sms__start').show();
                        $('.pronto-login__siginingin').hide();
                        $('.pronto-login__form').addClass('pronto-login-sms__form');
                        smsInput.val('');
                    } else if (result.indexOf('Error:') === 0) {
                        handleError(result.substr('Error:'.length));
                    }
                },
                error: function error() {
                    handleError('server communication error');
                }
            });
        },
        loadRequire = function loadRequire(showError, successCallback) {
            if (successCallback) {
                requireCallback = successCallback;
            }
            if (requireLoading || regureLoaded) {
                return;
            }
            requireLoading = true;
            $.ajax({
                url: basePathRef + 'require.js?rand=' + __revisionNumber,
                dataType: 'script',
                cache: true,
                success: function success() {
                    requireLoading = false;
                    regureLoaded = true;
                    if (requireCallback) {
                        requireCallback();
                    }
                },
                error: function error(jqxhr, settings, exception) {
                    requireLoading = false;
                    if (showError) {
                        $('.pronto-login__error-common').show().text(getErrorString(exception));
                    }
                }
            });
        },
        loadMain = function loadMain() {
            if (!regureLoaded) {
                loadRequire(true, loadMain);
                return;
            }
            clearInterval(checkButtonInterval);
            $.ajax({
                url: basePathRef + 'main.production.js?rand=' + __revisionNumber,
                dataFilter: function dataFilter(data, type) {
                    return data + '\n\n//@ sourceURL=main.production.js\n\n//# sourceURL=main.production.js';
                },
                dataType: 'script',
                cache: true,
                error: function error(jqxhr, settings, exception) {
                    $('.pronto-login__error-common').show().text(getErrorString(exception));
                }
            });
        },
        logIn = function logIn(uName, passwordOrSid, isSid, killOld) {
            $('.pronto-login__start').hide();
            $('.pronto-login__siginingin').show();
            $('.pronto-login__error').hide();

            if (!isSid && (useSMSAuth.toLowerCase() === 'yes' || useSMSAuth.toLowerCase() === 'true')) {
                loginWithSms(uName, passwordOrSid);
                return;
            }

            var params = {
                    secureMode: data.attr.protocol.toLowerCase() === 'https' ? 'YES' : 'NO',
                    serverName: data.attr.host + (data.attr.port ? ':' + data.attr.port : ''),
                    binding: 'HTTP',
                    userName: uName,
                    version: __protocolVersion,
                    loginMethod: isSid ? 'sessionid' : 'auto',
                    sessionid: passwordOrSid,
                    password: passwordOrSid,
                    asyncInput: __asyncInput,
                    asyncOutput: __asyncOutput,
                    asyncMode: __asyncMode,
                    killOldSession: !!killOld,
                    useCookie: __useCookie,
                    x2auth: 'YES',
                    canUpdatePwd: 'YES'
                },
                s = new XIMSSSession(params, null, function(session, error) {
                    if (!error) {
                        session.start();
                        sessionInstance = session;
                        session.setUnknownAsyncProcessor(session, asyncPreserver);
                        storedSid = isSid ? passwordOrSid : null;
                        storedLogInMethod = isSid ? 'sessionid' : 'auto';
                    } else {
                        handleError(error);
                        if (session && session.close) {
                            session.close();
                        }
                    }
                });
            s.setAsyncProcessor(this, function(sessionXML) {
                var sessionXMLjQ = $(sessionXML);
                storedUserName = sessionXMLjQ.attr('userName');
                storedSessionXML = sessionXML;
                changePasswordRequired = sessionXMLjQ.attr('changePassword') == '1';
                if (sessionXMLjQ.attr('x2auth') == '1') {
                    startMultifactor();
                } else if (changePasswordRequired) {
                    modifyPassword();
                } else {
                    loginFirstCommand();
                }
            }, 'session');
            return s;
        },
        startMultifactor = function startMultifactor() {
            var x2authNode = $(storedSessionXML).find('x2auth');
            if (x2authNode && x2authNode.length > 0) {
                $('.pronto-login__siginingin').hide();
                $('.pronto-login__multi-factor-authentication__form').show();
                startMultifactorAuthentication(x2authNode, function(error) {
                    if (error) {
                        if (sessionInstance) {
                            sessionInstance.close();
                            sessionInstance = null;
                        }
                        $('.pronto-login__multi-factor-authentication__form').hide();
                        $('#pronto-login__start').show();
                        $('.pronto-login__siginingin').hide();
                    } else {
                        $('.pronto-login__multi-factor-authentication__form').hide();
                        if (changePasswordRequired) {
                            modifyPassword();
                        } else {
                            loginFirstCommand();
                        }
                    }
                });
            } else {
                handleError('No x2auth methods, while expected');
            }
        },
        modifyPassword = function modifyPassword() {
            $('.pronto-login__siginingin').hide();
            $('.pronto-login__change-password__form').show();
            startPasswordModification(function(error) {
                if (error) {
                    if (sessionInstance) {
                        sessionInstance.close();
                        sessionInstance = null;
                    }
                    $('.pronto-login__change-password__form').hide();
                    $('#pronto-login__start').show();
                    $('.pronto-login__siginingin').hide();
                } else {
                    $('.pronto-login__change-password__form').hide();
                    loginFirstCommand();
                }
            });
        },
        loginFirstCommand = function loginFirstCommand() {
            if (!sessionInstance) {
                handleError('No session');
                return;
            }
            var prefsReadNode = sessionInstance.createXMLNode('prefsRead'),
                name = sessionInstance.createXMLNode('name');
            name.appendChild(sessionInstance.createTextNode('Language'));
            prefsReadNode.appendChild(name);
            sessionInstance.sendRequest(prefsReadNode, null, function(responseXML, requestXML) {
                var langNode;
                if (responseXML.nodeName === 'prefs') {
                    langNode = responseXML.getElementsByTagName('Language')[0];
                    userLang = (langNode && langNode.childNodes && langNode.childNodes.length > 0 ? langNode.childNodes[0].nodeValue : '') || '';
                }
            }, function(error, requestXML) {
                $('.pronto-login__start').hide();
                $('.pronto-login__siginingin').show();
                $('.pronto-login__error').hide();
                passInput.val('');
                loadMain();
            }, true);
        },
        loginWithSmsConfirm = function loginWithSmsConfirm(uName, smsPassword) {
            $('.pronto-login__start').hide();
            $('.pronto-login__siginingin').show();
            $('.pronto-login__error').hide();
            $.ajax({
                url: data.attr.base + '/cgi-bin/smscheck2.pl',
                type: 'POST',
                data: {
                    username: normalizeUsername(uName),
                    code: smsPassword
                },
                dataType: 'text',
                success: function success(result) {
                    if (!result) {
                        handleError('unknown error', true);
                    } else if (result.indexOf('Error:') === 0) {
                        handleError(result.substr('Error:'.length), true);
                    } else if (result.indexOf('Authorized:') === 0) {
                        logIn(uName, result.split('\n')[0].split('\r')[0].split('Authorized: ')[1], true);
                    }
                },
                error: function error() {
                    handleError('server communication error', true);
                }
            });
        },
        getPassEnc = function getPassEnc(password) {
            return GibberishAES.enc(password, host);
        },
        getLogInEnc = function getLogInEnc(logIn) {
            return GibberishAES.enc(logIn, host);
        },
        decPass = function decPass(passwordEnc) {
            return GibberishAES.dec(passwordEnc, host);
        },
        decLogIn = function decLogIn(logInEnc) {
            return GibberishAES.dec(logInEnc, host);
        },
        fillCredentials = function fillCredentials() {
            var passEnc = getLocalItem('p'),
                logInEnc = getLocalItem('l'),
                pass = passEnc ? decPass(passEnc) : '',
                logIn = logInEnc ? decLogIn(logInEnc) : '';
            loginInput.val(logIn);
            passInput.val(pass);
        },
        fillStorage = function fillStorage() {
            var username = loginInput.val(),
                password = passInput.val(),
                logInEnc = getLogInEnc(username),
                passEnc = getPassEnc(password);
            setLocalItem('p', passEnc);
            setLocalItem('l', logInEnc);
        },
        clearStorage = function clearStorage() {
            removeLocalItem('p');
            removeLocalItem('l');
        },
        oldPass = '',
        oldLogIn = '',
        oldSmsCode = '',
        submitButton = $('.pronto-login__submit'),
        checkButton = function checkButton() {
            var username = loginInput.val(),
                password = passInput.val(),
                smsCode = smsInput.val(),
                chromeAutofill = false;
            try {
                if (password === '' && passInput.is(':-webkit-autofill')) {
                    chromeAutofill = true; // Chrome autofill always has empty password due to bug
                }
            } catch (e) {
                // Just nothing: chromeAutofill still false
            }
            if (oldPass !== password || oldLogIn !== username || oldSmsCode !== smsCode) {
                if (username && username.length > 0 && (password && password.length > 0 || chromeAutofill) || smsCode.length > 0) {
                    submitButton.removeAttr('disabled');
                } else {
                    submitButton.attr('disabled', 'disabled');
                }
                if (!smsCode) {
                    if (enableCredentialsStoring && $('.pronto-login__remember-field')[0].checked) {
                        fillStorage();
                    } else {
                        clearStorage();
                    }
                }
                oldPass = password;
                oldLogIn = username;
                oldSmsCode = smsCode;
            }
        },
        checkLocalStorage = function checkLocalStorage() {
            if (enableCredentialsStoring) {
                var remember = getLocalItem('remember'),
                    rememberValue = typeof remember === 'string' ? remember === 'true' : remember,
                    checkbox = $('.pronto-login__remember-field')[0];
                checkbox.checked = rememberValue;
                if (rememberValue) {
                    fillCredentials();
                } else {
                    clearStorage();
                }
            } else {
                clearStorage();
                $('.pronto-login__remember').hide();
            }
        },
        recoveryVisibility = function recoveryVisibility(type) {
            $('.pronto-login__error-password-recovery').hide();
            $('.pronto-login__soccess-password-recovery').hide();
            if (type === 'hide') {
                $('.pronto-login-password-recovery__start').hide();
                $('.pronto-login-auth__start').show();
            } else if (type === 'show') {
                $('.pronto-login-auth__start').hide();
                $('.pronto-login-password-recovery__start').show();
                $('.pronto-login__recover-password').prop('disabled', false);
            }
        },
        recoverPassword = function recoverPassword(callback) {
            var xmlhttp = new XMLHttpRequest(),
                url = '/ximssLogin/',
                request = "<XIMSS><recoverPassword id='0' domain='",
                userName = '';

            xmlhttp.open('POST', url, true);
            xmlhttp.setRequestHeader('Content-Type', 'text/xml');
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState === 4) {
                    callback(xmlhttp.responseText);
                }
            };
            if ($('.pronto-login__recover-account-password').val()) {
                userName = $('.pronto-login__recover-account-password').val();
            }
            request += host + "' userName='";
            request += userName + "' /></XIMSS>";
            xmlhttp.send(request);
        },
        startInitialized = false,
        startCommon = function startCommon(afterError) {
            if (startInitialized) {
                return;
            }
            if (!afterError) {
                $('#pronto-login__start').show();
            }
            checkLocalStorage();
            checkButton();
            checkButtonInterval = setInterval(checkButton, 100);
            if (enableCredentialsStoring) {
                $('.pronto-login__remember-field').change(function() {
                    setLocalItem('remember', this.checked);
                    if (this.checked) {
                        fillStorage();
                    } else {
                        clearStorage();
                    }
                });
            }

            var forgotPasswordOption = $('.pronto-login__loginoptions-forgotpassword').text();
            if (forgotPasswordOption != 'YES') {
                $('.pronto-login__recover-password-invite').hide();
            }

            $('.pronto-login__recover-password-invite').click(function() {
                var originalUserName = $('.pronto-login__login').val();
                recoveryVisibility('show');
                if (originalUserName) {
                    $('.pronto-login__recover-account-password').val(originalUserName);
                }
            });
            $('.pronto-login__cancel-recover-password').click(function() {
                recoveryVisibility('hide');
            });
            $('.pronto-login__recover-password').click(function() {
                recoveryVisibility('hideMessages');
                $('.pronto-login__recover-password').prop('disabled', true);
                recoverPassword(function n(response) {
                    var resp = $(response).find('response'),
                        error = resp.attr('errorText');

                    if (!resp.length) {
                        error = 'Wrong request';
                    }

                    if (error) {
                        $('.pronto-login__error-password-recovery').show();
                        $('.pronto-login__error-password-recovery').text(error);
                        $('.pronto-login__recover-password').prop('disabled', false);
                    } else {
                        $('.pronto-login__error-password-recovery').hide();
                        $('.pronto-login__soccess-password-recovery').show();
                        setTimeout(function() {
                            recoveryVisibility('hide');
                        }, 2000);
                    }
                });
            });

            $('#mainFrom').submit(function() {
                if ($('.pronto-login-sms__start:visible').length > 0) {
                    loginWithSmsConfirm(loginInput.val(), $('#smsPassword').val());
                } else if ($('.pronto-login__multi-factor-authentication__form:visible').length > 0) {
                    // do nothing, just enter handling inside x2auth
                } else if ($('.pronto-login__change-password__form:visible').length > 0) {
                    // do nothing, just enter handling inside password modification
                } else {
                    var username = loginInput.val(),
                        password = passInput.val();

                    if (useExtraDomain) {
                        if (username.indexOf('@') < 0) {
                            username += '@' + $('#pronto-login__domain-selector').val();
                        }
                    }
                    logIn(username, password);
                }
                return false;
            });
            startInitialized = true;

            if (getCookie('userName') && getCookie('sessionid')) {
                logIn(decryptCookie(getCookie('userName')), decryptCookie(getCookie('sessionid')), true, true);
            }
        },
        initLoginScreen = function initLoginScreen() {
            if (!loginDomains || loginDomains.length < 1) {
                useExtraDomain = false;
            } else {
                useExtraDomain = true;
                $('#pronto-login__domain-select-line').show();
                for (var i = 0; i < loginDomains.length; i++) {
                    var option = '<option ' + (i == 0 ? 'selected' : '') + '>' + loginDomains[i] + '</option>';
                    $('#pronto-login__domain-selector').append(option);
                }
            }
            loginInput.focus();
        },
        start = function start() {
            function toBool(val) {
                var v = val.toLowerCase();
                if (v === '1' || v === 'true' || v === 'yes') {
                    return true;
                }
                return false;
            }
            var uname,
                sid,
                pwd,
                killOld = false;
            if (data.param.query.hasOwnProperty('logoutURL')) {
                storedLogoutURL = decodeURIComponent(data.param.query.logoutURL);
            }
            loadRequire();
            if ((data.param.query.hasOwnProperty('p-username') || data.param.query.hasOwnProperty('username')) && (data.param.query.hasOwnProperty('p-sid') || data.param.query.hasOwnProperty('sid') || data.param.query.hasOwnProperty('password') || data.param.query.hasOwnProperty('p-password'))) {
                uname = data.param.query.hasOwnProperty('p-username') ? decodeURIComponent(data.param.query['p-username']) : decodeURIComponent(data.param.query.username);
                if (data.param.query.hasOwnProperty('p-sid') || data.param.query.hasOwnProperty('sid')) {
                    sid = data.param.query.hasOwnProperty('p-sid') ? decodeURIComponent(data.param.query['p-sid']) : decodeURIComponent(data.param.query.sid);
                    killOld = data.param.query.hasOwnProperty('killOld') ? toBool(data.param.query.killOld) : false;
                    logIn(uname, sid, true, killOld);
                } else {
                    pwd = data.param.query.hasOwnProperty('p-password') ? decodeURIComponent(data.param.query['p-password']) : decodeURIComponent(data.param.query.password);
                    logIn(uname, pwd);
                }
            } else {
                startCommon();
            }
            initLoginScreen();
            initMultifactor();
            initPasswordModification();
        };

    $('#try_anyway_link').click(function() {
        $('.pronto-login').show();
        $('#pronto-login__not-supported-browser').hide();
        start();
    });

    start();
})();
$(document).ready(function() {
    if (window.matchMedia('only screen and (max-width: 760px)').matches) {
        $isMobile = true;
    }
    //	if (window.matchMedia("only screen and (max-width: 1920px)").matches) {
    //		$isMobile = true;
    //	}
});