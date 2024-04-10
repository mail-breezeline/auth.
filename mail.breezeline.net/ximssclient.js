// /*NOPACK*/ /*jshint unused:true, eqnull:true*/ /*globals CRYDigesterMD5:false */
// // ================================================== //
// //          XIMSS Client Library (JavaScript)         //
// //                                                    //
// // Version 1.0.34                                     //
// // Copyright (c) 2010-2017, Stalker Software, Inc.    //
// // ================================================== //
// function XIMSSSession(params, openCallbackRef, openCallbackMethod) {
//     'use strict';
//     var self = this;
//     var theWindow = window;
//     var jobId = XIMSSSession.idCounter = (XIMSSSession.idCounter || 0) + 1;

//     var MaxBufferedRequests = 10;
//     var ximssRequestSeqId = 0;
//     var isDead = false, // a fatal error has been received
//         isStarted = false, // start() has been invoked
//         isClosed = false; // "<bye>" has been enqueued

//     var asyncRegistry = new XIMSSListenerRegistry();
//     var asyncUnknown = null;

//     var pendingRequests = {};
//     var collectedReqIds = [];
//     var sendCollectedNow = false;
//     var sendInProgress = false;

//     var initialXMLs = []; // xml stanzas received before start() is called


//     function scheduleDelayed(f, millisecs) {
//         return (theWindow.setTimeout(f, millisecs || 0));
//     }

//     function cancelDelayed(theTimer) {
//         if (theTimer != null) theWindow.clearTimeout(theTimer);
//     }

//     function createCallback(theRef, theMethod) {
//         return function() {
//             return (theMethod.call(theRef));
//         };
//     }

//     function createCallback1(theRef, theMethod) {
//         return function(arg1) {
//             return (theMethod.call(theRef, arg1));
//         };
//     }

//     function createCallback2(theRef, theMethod) {
//         return function(arg1, arg2) {
//             return (theMethod.call(theRef, arg1, arg2));
//         };
//     }

//     this.setDebugFunction = function(newDebugObject, newDebugMethod) {
//         self.debugMethod = newDebugMethod;
//         self.debugObject = newDebugObject;
//     };

//     this.getJobId = function() {
//         return (jobId);
//     };

//     function debugLog(prefix, y) {
//         self.debugFunction("XIMSS(" + jobId + ")", prefix + ":" + y);
//     }

//     function xml2Debug(xmlData) {
//         return (!self.debugShowXML ? xmlData.tagName : window.XMLSerializer ? (new XMLSerializer()).serializeToString(xmlData) : xmlData.xml);
//     }

//     function canAssign(x, y) {
//         return ((x == null) != (y == null));
//     }

//     this.setAsyncProcessor = function(theRef, newCallback, theTagName, theAttrName, theAttrValue) {
//         if (newCallback != null && theRef != null) newCallback = createCallback1(theRef, newCallback);
//         return (asyncRegistry.registerCallback(newCallback, theTagName, theAttrName, theAttrValue));
//     };

//     this.setUnknownAsyncProcessor = function(theRef, newCallback) {
//         if (newCallback != null && theRef != null) newCallback = createCallback1(theRef, newCallback);
//         var retCode = canAssign(newCallback, asyncUnknown);
//         if (retCode) {
//             asyncUnknown = newCallback;
//         }
//         return (retCode);
//     };


//     var netErrorCallback = null,
//         netOKCallback = null,
//         netErrorTimeReported = new Date(),
//         netErrorReported = false,
//         netErrorTimeLimit = 0;

//     this.setNetworkErrorProcessor = function(theRef, newCallback, timeLimit) {
//         if (newCallback != null && theRef != null) newCallback = createCallback2(theRef, newCallback);
//         var retCode = canAssign(newCallback, netErrorCallback);
//         if (retCode) {
//             netErrorCallback = newCallback;
//             netErrorTimeLimit = (timeLimit == null ? 10 : timeLimit);
//         }
//         return (true);
//     };

//     this.setNetworkOKProcessor = function(theRef, newCallback) {
//         if (newCallback != null && theRef != null) newCallback = createCallback(theRef, newCallback);
//         var retCode = canAssign(newCallback, netOKCallback);
//         if (retCode) {
//             netOKCallback = newCallback;
//         }
//         return (true);
//     };

//     function reportNetworkError(isFatal, elapsed) {
//         if (isDead) return (true);
//         var thisTime = new Date();
//         if (isFatal || (netErrorCallback != null && netErrorTimeReported.getTime() + netErrorTimeLimit * 1000 < thisTime.getTime())) {
//             if (netErrorCallback != null) {
//                 netErrorReported = true;
//                 if (netErrorCallback(isFatal, elapsed / 1000)) isFatal = true;
//                 netErrorTimeReported = thisTime;
//             }
//         }
//         if (isFatal) {
//             debugLog("sys", "session aborted");
//             interruptAllPending();
//         }
//         return (!isFatal);
//     }

//     function reportNetworkOK() {
//         if (isDead) return;
//         if (netOKCallback != null && netErrorReported) {
//             netErrorReported = false;
//             netOKCallback();
//         }
//     }

//     var sendRequestAndUnlock = function() {
//         throw "not implemented";
//     };
//     var startConnection = function() {
//         throw "not implemented";
//     };
//     var interruptConnection = function() {
//         throw "not implemented";
//     };
//     var delayedSender = null;

//     this.sendRequest = function(xmlRequest, theRef, dataCallback, finalCallback, sendImmediately) {
//         if (theRef != null) {
//             if (dataCallback != null) dataCallback = createCallback2(theRef, dataCallback);
//             if (finalCallback != null) finalCallback = createCallback2(theRef, finalCallback);
//         }

//         ximssRequestSeqId %= 1000000; // limit to 6 digits, we hope there would be no coflict
//         var theSeqId = "" + (++ximssRequestSeqId);
//         xmlRequest.setAttribute("id", theSeqId);

//         // if the session is already dead, return an error immediately, and do nothing more
//         if (isDead || !isStarted || isClosed) {
//             if (finalCallback != null) finalCallback("communication error", xmlRequest);
//             return;
//         }

//         debugLog("out", xml2Debug(xmlRequest));

//         var theRequest = pendingRequests[theSeqId] = {};
//         theRequest.xmlRequest = xmlRequest;
//         theRequest.dataCallback = dataCallback;
//         theRequest.finalCallback = finalCallback;
//         if (xmlRequest.tagName == "bye") isClosed = true; // @1.0.23: response to bye should be processed synchronously, so we will not re-start reading.

//         collectedReqIds.push(theSeqId);
//         if ((sendImmediately !== false) || collectedReqIds.length >= MaxBufferedRequests) sendCollectedNow = true;

//         if (!sendCollectedNow || sendInProgress) { // @1.0.30: delayed sending (but this can delay sending <bye/>
//             debugLog("out", "postponed");
//         } else if (params.asyncOutput && !isClosed && collectedReqIds.length < MaxBufferedRequests) {
//             if (delayedSender == null) delayedSender = scheduleDelayed(function() {
//                 delayedSender = null;
//                 sendRequestAndUnlock();
//             });
//         } else {
//             if (delayedSender != null) {
//                 cancelDelayed(delayedSender);
//                 delayedSender = null;
//             }
//             sendRequestAndUnlock();
//         }
//     };

//     var responseQueue = [];
//     var nScheduled = 0;

//     function processXMLResponseQueue() {
//         --nScheduled;
//         for (var xResponse = 0; xResponse < 10 && responseQueue.length !== 0; ++xResponse) { // @1.0.21
//             var xmlResponse = responseQueue.shift();
//             if (responseQueue.length !== 0 && nScheduled === 0) {
//                 ++nScheduled;
//                 scheduleDelayed(processXMLResponseQueue);
//             } // @1.0.21
//             syncProcessXMLResponse(xmlResponse);
//         }
//     }

//     function processXMLResponse(xmlResponse) {
//         if (isDead) return;
//         if (!isClosed && params.asyncInput) {
//             debugLog("a-inp(" + responseQueue.length + ")", xmlResponse.tagName);
//             //    scheduleDelayed(function() {syncProcessXMLResponse(xmlResponse)},0);  1.0.19: cannot do that, as some browsers can run scheduled tasks in the wrong order
//             //    if(responseQueue.length == 0) scheduleDelayed(processXMLResponseQueue,0);
//             if (nScheduled === 0) {
//                 ++nScheduled;
//                 scheduleDelayed(processXMLResponseQueue);
//             } // @1.0.21
//             responseQueue.push(xmlResponse);
//         } else {
//             syncProcessXMLResponse(xmlResponse);
//         }
//     }

//     function syncProcessXMLResponse(xmlResponse) {
//         if (isDead) return;
//         debugLog("inp", xml2Debug(xmlResponse));

//         try { // @1.0.30
//             var theSeqId = xmlResponse.getAttribute("id");
//             if (theSeqId != null) {
//                 if (theSeqId != "noop") {
//                     var theDescr = pendingRequests[theSeqId];

//                     if (theDescr == null) {
//                         debugLog("err", "unexpected response. id=" + theSeqId);
//                     } else if (xmlResponse.tagName == "response") {
//                         delete pendingRequests[theSeqId];
//                         if (theDescr.xmlRequest.tagName == "bye") {
//                             debugLog("sys", "BYE accepted");
//                             interruptAllPending();
//                         }
//                         if (theDescr.finalCallback != null) theDescr.finalCallback(xmlResponse.getAttribute("errorText"), theDescr.xmlRequest);
//                     } else {
//                         if (theDescr.dataCallback != null) theDescr.dataCallback(xmlResponse, theDescr.xmlRequest);
//                     }
//                 }

//             } else if (xmlResponse.tagName == "bye") {
//                 debugLog("sys", "BYE received");
//                 reportNetworkError(true, 0);

//             } else { // no "id" attribute -> async message
//                 if (!asyncRegistry.callCallbacks(xmlResponse)) {
//                     if (asyncUnknown != null) asyncUnknown(xmlResponse);
//                     else debugLog("err", "unexpected async: " + xmlResponse.tagName);
//                 }
//             }
//         } catch (error) {
//             debugLog("app", xmlResponse.tagName + " processing crashed:" + error.toString());
//             if (error.stack != null) console.log(error.stack);
//         }
//     }

//     this.setDelayedResponseProcessing = function(x) {
//         params.asyncInput = x;
//     };

//     function clearCollectedRequestsUnderLock() {
//         while (collectedReqIds.length !== 0) collectedReqIds.pop();
//         sendCollectedNow = false;
//     }

//     function interruptAllPending() {
//         isDead = true;
//         clearCollectedRequestsUnderLock();

//         for (var id in pendingRequests)
//             if (pendingRequests.hasOwnProperty(id)) {
//                 var theDescr = pendingRequests[id];
//                 if (theDescr.finalCallback != null) theDescr.finalCallback("communication error", theDescr.xmlRequest);
//             }
//         pendingRequests = {};
//         interruptConnection();
//     }


//     this.start = function() {
//         if (isDead || isStarted) {
//             return;
//         }

//         while (initialXMLs.length !== 0) processXMLResponse(initialXMLs.shift());
//         isStarted = true;
//         startConnection();
//     };

//     this.close = function(theRef, finalCallback) {
//         self.sendRequest(self.createXMLNode("bye"), theRef, null, finalCallback, true);
//     };

//     this.abend = function() {
//         params.syncClose = true;
//         self.close();
//     }; // @1.0.30

//     this.getServerName = function() {
//         return (params.serverName);
//     }; // @1.0.28

//     //
//     // HTTP implementation
//     //
//     function httpBinding() {
//         var httpBaseURL;
//         var httpPOSTTimeOut = 10,
//             asyncGetWaitInSeconds = 20;

//         var sendBatchSeqId = 0,
//             readBatchAckId = 0;
//         var POSTURLRandom = 0,
//             GETURLRandom = 0;
//         var POSTHTTPRequest = null,
//             GETHTTPRequest = null;

//         var currentPOSTURL = null,
//             currentGETURL = null;
//         var currentPOSTBody = null;
//         var currentPOSTErrors = 0,
//             currentGETErrors = 0;
//         var currentPOSTComposed, currentGETComposed;
//         var currentPOSTStarted, currentGETStarted;

//         var POSTTimer = null,
//             GETTimer = null;

//         var POSTXMLDocument = null;
//         var asyncMode = params.asyncMode;
//         var useOldXDR = window.XDomainRequest && (document.all && !window.atob) && window.location.host != params.serverName; // IE 9 and earlier: cross-domain requires XDomainRequest

//         var sessionLost = "you have been disconnected";

//         function isFatalError(errorCode) {
//             return (errorCode == sessionLost);
//         }

//         function ioDebugLog(x) {
//             if (self.debugIO) self.debugFunction("HTTP", x);
//         }

//         function composePOSTUnderLock() {
//             for (var x;
//                 (x = POSTXMLDocument.firstChild) != null;) POSTXMLDocument.removeChild(x);
//             currentPOSTBody = POSTXMLDocument.createElement("XIMSS");
//             if (collectedReqIds.length > 0) {
//                 for (var i = 0; i < collectedReqIds.length; ++i) {
//                     currentPOSTBody.appendChild(pendingRequests[collectedReqIds[i]].xmlRequest);
//                 }
//                 ioDebugLog("POST composed for " + collectedReqIds.length + " commands");
//             } else {
//                 var xmlNoop = POSTXMLDocument.createElement("noop");
//                 xmlNoop.setAttribute("id", "noop");
//                 currentPOSTBody.appendChild(xmlNoop);
//                 ioDebugLog("POST composed for 'noop'");
//             }
//             POSTXMLDocument.appendChild(currentPOSTBody);
//             currentPOSTBody = POSTXMLDocument;

//             clearCollectedRequestsUnderLock();

//             // @1.0.28: for the final batch (which includes <bye/>) read responses synchronously, and read all async responses, too
//             if (isClosed) asyncMode = "noAsync";

//             currentPOSTURL = httpBaseURL + (asyncMode == "asyncPOST" ? "async" : "sync") + "?reqSeq=" + (++sendBatchSeqId);
//             if (asyncMode == "noAsync") {
//                 currentPOSTURL += "&syncAsync=1";
//             }

//             currentPOSTErrors = 0;
//             currentPOSTComposed = netErrorTimeReported = new Date();
//             sendInProgress = true;
//         }

//         function startComposedPOST() {
//             currentPOSTStarted = new Date();
//             updatePOSTTimeout();
//             if ((POSTHTTPRequest = self.startHTTPRequest(processPOSTCompletion, updatePOSTTimeout, "POST", currentPOSTURL + "&random=" + (++POSTURLRandom), currentPOSTBody)) != null) {
//                 ioDebugLog("POST sent");
//             }
//         }

//         function updatePOSTTimeout() {
//             cancelDelayed(POSTTimer);
//             POSTTimer = scheduleDelayed(processPOSTTimeout, httpPOSTTimeOut * 1000);
//         }

//         function processPOSTTimeout() {
//             POSTTimer = null;
//             if (POSTHTTPRequest != null) {
//                 ioDebugLog("POST time-out");
//                 cancelHTTPRequest(POSTHTTPRequest);
//                 processPOSTCompletion(null, "request time-out");
//             }
//         }

//         function startNoopPOST() {
//             if (!sendInProgress) {
//                 POSTTimer = null;
//                 if (!isClosed && !isDead) { // @1.0.22
//                     composePOSTUnderLock();
//                     startComposedPOST();
//                 }
//             }
//         }


//         function processPOSTCompletion(xmlData, errorCode) {
//             ioDebugLog("POST completed" + (errorCode == null ? "" : " errorCode=" + errorCode));
//             if (POSTHTTPRequest == null) {
//                 ioDebugLog("POST missing");
//                 return;
//             }

//             cancelDelayed(POSTTimer);
//             POSTTimer = null;
//             POSTHTTPRequest = null;

//             if (errorCode == null && asyncMode != "asyncPOST") {
//                 if (xmlData == null) {
//                     errorCode = "no XML in POST response";
//                 } else {
//                     for (var i = 0; i < xmlData.childNodes.length; ++i) {
//                         processXMLResponse(xmlData.childNodes[i]);
//                     }
//                 }
//             }

//             if (isDead) { // we have been closed/suspended
//                 sendInProgress = false;
//                 ioDebugLog("POST loop finished");
//             } else if (errorCode == null) {
//                 reportNetworkOK();
//                 sendInProgress = false;
//                 if (sendCollectedNow) {
//                     composePOSTUnderLock();
//                     startComposedPOST();
//                 } else if (isClosed) {
//                     ioDebugLog("POST loop finished");
//                 } else if (params.pollPeriod != null) {
//                     POSTTimer = scheduleDelayed(startNoopPOST, params.pollPeriod * 1000);
//                 }
//             } else {
//                 var isFatal = isFatalError(errorCode);
//                 if ((isFatal || ++currentPOSTErrors >= 2) && !reportNetworkError(isFatal, (new Date()).getTime() - currentPOSTComposed.getTime())) {
//                     sendInProgress = false;
//                     return;
//                 }

//                 var delayTime =
//                     isClosed ? 0 :
//                     currentPOSTErrors >= 20 ? 10000 :
//                     currentPOSTErrors >= 10 ? 5000 :
//                     currentPOSTErrors >= 5 ? 2000 :
//                     currentPOSTErrors >= 2 ? 200 : 0;

//                 if (delayTime > 0) {
//                     if ((delayTime = currentPOSTStarted.getTime() + delayTime - (new Date()).getTime()) < 100) delayTime = 100;
//                     ioDebugLog("POST paused for " + delayTime + " msecs");
//                 }
//                 POSTTimer = scheduleDelayed(startComposedPOST, delayTime);
//             }
//         }

//         sendRequestAndUnlock = function() {
//             if (sendInProgress || !sendCollectedNow) {
//                 ioDebugLog("POST postponed");
//                 return;
//             }
//             cancelDelayed(POSTTimer);
//             POSTTimer = null;
//             composePOSTUnderLock();
//             startComposedPOST();
//         };

//         function startComposedGET() {
//             currentGETStarted = new Date();
//             updateGETTimeout();
//             GETHTTPRequest = self.startHTTPRequest(processGETCompletion, updateGETTimeout, "GET", currentGETURL + "&random=" + (++GETURLRandom), null);
//             ioDebugLog("GET sent");
//         }

//         function updateGETTimeout() {
//             cancelDelayed(GETTimer);
//             GETTimer = scheduleDelayed(processGETTimeout, (asyncGetWaitInSeconds + 2) * 1000);
//         }

//         function processGETTimeout() {
//             GETTimer = null;
//             if (GETHTTPRequest != null) {
//                 ioDebugLog("GET time-out");
//                 cancelHTTPRequest(GETHTTPRequest);
//                 processGETCompletion(null, "request time-out");
//             }
//         }

//         function composeAndStartGET() {
//             currentGETURL = httpBaseURL + "?ackSeq=" + readBatchAckId +
//                 "&maxWait=" + asyncGetWaitInSeconds;

//             startComposedGET();
//             currentGETComposed = netErrorTimeReported = new Date();
//         }

//         function processGETCompletion(xmlData, errorCode) {
//             ioDebugLog("GET completed" + (errorCode == null ? "" : ", errorCode=" + errorCode) + (xmlData == null ? "" : ", data read"));
//             if (GETHTTPRequest == null) {
//                 ioDebugLog("GET missing");
//                 return;
//             }

//             cancelDelayed(GETTimer);
//             GETTimer = null;
//             GETHTTPRequest = null;

//             if (errorCode != null) {} else if (xmlData == null) {
//                 errorCode = "no XML in GET response";
//             } else {
//                 var respReqAttr = xmlData.getAttribute("respSeq");
//                 if (respReqAttr != null) readBatchAckId = respReqAttr;
//                 for (var i = 0; i < xmlData.childNodes.length; ++i) {
//                     processXMLResponse(xmlData.childNodes[i]);
//                 }
//             }

//             if (!isStarted || isDead || isClosed) { // @1.0.28: when <bye/> is enqueued, all POSTS are sync + syncAsync, and we do not need any more GETs
//                 ioDebugLog("GET loop finished");
//             } else if (errorCode == null) {
//                 reportNetworkOK();
//                 composeAndStartGET();
//             } else {
//                 var isFatal = isFatalError(errorCode);
//                 if ((isFatal || ++currentGETErrors >= 2) && !reportNetworkError(isFatal, (new Date()).getTime() - currentGETComposed.getTime())) return;

//                 var delayTime =
//                     currentGETErrors >= 20 && (asyncMode != "asyncPOST" || !sendInProgress) ? 30000 :
//                     currentGETErrors >= 10 ? 5000 :
//                     currentGETErrors >= 5 ? 2000 :
//                     currentGETErrors >= 2 ? 200 : 0;
//                 if (delayTime > 0) {
//                     if ((delayTime = currentGETStarted.getTime() + delayTime - (new Date()).getTime()) < 100) delayTime = 100;
//                     ioDebugLog("GET paused for " + delayTime + " msecs");
//                 }
//                 GETTimer = scheduleDelayed(startComposedGET, delayTime);
//             }
//         }

//         self.startHTTPRequest = function(callback, timerUpdate, method, url, body, userName, userPassword) {

//             function requestCompleted(errorCode, responseXML) {
//                 var ximssData = null;
//                 if (errorCode == null && responseXML != null) {
//                     if ((ximssData = responseXML.childNodes[0]) == null || ximssData.tagName != "XIMSS") {
//                         ximssData = null;
//                         errorCode = "server XML response is not XIMSS";
//                     } else if (POSTXMLDocument == null) POSTXMLDocument = responseXML;
//                 }
//                 callback(ximssData, errorCode);
//             }

//             if (useOldXDR) { // IE 9 or less
//                 httpRequest = new XDomainRequest();
//                 if (httpRequest == null) {
//                     callback(null, "XDomainRequest failed");
//                 }

//                 httpRequest.ontimeout = httpRequest.onerror = function() {
//                     requestCompleted("xdr communication error");
//                 };
//                 httpRequest.onprogress = function() {
//                     if (timerUpdate != null && !httpRequest.aborted) {
//                         timerUpdate();
//                     }
//                 };
//                 httpRequest.onload = function() {
//                     if (httpRequest.responseText == null) {
//                         requestCompleted(null);
//                         //        } else if(httpRequest.contentType != "text/xml") {                         // it always returns "text/plain"
//                     } else if (httpRequest.responseText.charAt(0) != "<") {
//                         requestCompleted(sessionLost);
//                     } else if (window.DOMParser) {
//                         requestCompleted(null, new DOMParser().parseFromString(httpRequest.responseText, "application/xml"));
//                     } else {
//                         var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
//                         xmlDoc.async = false;
//                         xmlDoc.loadXML(httpRequest.responseText);
//                         requestCompleted(null, xmlDoc);
//                     }
//                 };

//                 var synchronousHTTP = isClosed && method == "POST" && params.syncClose != null;
//                 var httpRequest;

//                 httpRequest.open(method, url);
//                 if (body != null && typeof(body) !== "string") body = window.XMLSerializer ? new XMLSerializer().serializeToString(body) : body.xml;
//                 httpRequest.send(body);
//                 return (httpRequest);
//             }

//             httpRequest = new XMLHttpRequest();
//             if (httpRequest == null) {
//                 callback(null, "XMLHttpRequest failed");
//             }

//             function xmlHttpCompleted() {
//                 if (httpRequest.status === 0) {
//                     requestCompleted("server communication error");
//                 } else if (httpRequest.status == 550) {
//                     requestCompleted(sessionLost);
//                 } else if (httpRequest.status < 200 || httpRequest.status >= 300) {
//                     // synchronousHTTP-> sessionLost to avoid recursion
//                     requestCompleted(synchronousHTTP ? sessionLost : httpRequest.statusText != null ? httpRequest.statusText : "server protocol error");
//                 } else if (httpRequest.responseXML != null) { // @1.0.20          
//                     requestCompleted(null, httpRequest.responseXML);
//                 } else {
//                     requestCompleted(httpRequest.responseText != null && httpRequest.responseText !== "" ? "server response is not XML" : null);
//                 }
//             }

//             if (synchronousHTTP) {
//                 ioDebugLog("POST sent synchronously");
//             } else {
//                 httpRequest.onreadystatechange = function() {
//                     if (httpRequest.aborted) {} else if (httpRequest.readyState == 4) xmlHttpCompleted();
//                     else if (timerUpdate != null) timerUpdate();
//                 };

//                 httpRequest.onprogress = function() {
//                     if (timerUpdate != null && !httpRequest.aborted && httpRequest.readyState != 4) {
//                         timerUpdate();
//                     } // @1.0.25: aborted, readyState check
//                 };
//             }

//             httpRequest.open(method, url, !synchronousHTTP, userName, userPassword);
//             if (typeof(body) == "string") httpRequest.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
//             httpRequest.send(body);
//             if (!synchronousHTTP) return (httpRequest);
//             POSTHTTPRequest = httpRequest;
//             xmlHttpCompleted();
//             return (null);
//         };

//         function cancelHTTPRequest(httpRequest) {
//             httpRequest.aborted = true;
//             httpRequest.abort();
//         }

//         startConnection = function() {
//             if (asyncMode != "noAsync") composeAndStartGET();
//         };

//         interruptConnection = function() {
//             cancelDelayed(POSTTimer);
//             POSTTimer = null;
//             cancelDelayed(GETTimer);
//             GETTimer = null;

//             if (POSTHTTPRequest != null) {
//                 ioDebugLog("interrupting POST");
//                 cancelHTTPRequest(POSTHTTPRequest);
//                 POSTHTTPRequest = null;
//             }
//             if (GETHTTPRequest != null) {
//                 ioDebugLog("interrupting GET");
//                 cancelHTTPRequest(GETHTTPRequest);
//                 GETHTTPRequest = null;
//             }
//         };

//         self.createXMLNode = function(tagName) {
//             if (POSTXMLDocument == null) throw "no POSTXMLDocument preserved";
//             return (POSTXMLDocument.createElement(tagName));
//         };
//         self.createTextNode = function(text) {
//             if (POSTXMLDocument == null) throw "no POSTXMLDocument preserved";
//             return (POSTXMLDocument.createTextNode(text));
//         };

//         var loginURL;

//         function loginHTTPCompletion(xmlData, errorCode) {

//             if (errorCode == null && xmlData == null) errorCode = "empty response on login";

//             if (errorCode == null) {
//                 var xmlFirst = xmlData.childNodes[0];
//                 if (xmlFirst != null && xmlFirst.tagName == "response") {
//                     errorCode = xmlFirst.getAttribute("errorText");
//                 } else if (xmlFirst != null && xmlFirst.tagName == "session") {
//                     var theURL = xmlFirst.getAttribute("urlID");
//                     if (theURL != null) {
//                         httpBaseURL += "Session/" + theURL + "/";
//                         if (typeof(navigator.sendBeacon) !== 'undefined') {
//                             self.abend = function() {
//                                 isClosed = true;
//                                 navigator.sendBeacon(httpBaseURL + "KILL", null);
//                             };
//                         }

//                         for (var i = 0; i < xmlData.childNodes.length; ++i) {
//                             initialXMLs.push(xmlData.childNodes[i]);
//                         }
//                     } else {
//                         errorCode = "the 'session' 'urlID' data is missing";
//                     }
//                 } else {
//                     errorCode = "the 'session' data is missing";
//                 }
//             }
//             if (openCallbackMethod != null) openCallbackMethod.call(openCallbackRef, errorCode == null ? self : null, errorCode);
//         }


//         function preSessionHTTPCompletion(xmlData, errorCode) {
//             if (openCallbackMethod != null) openCallbackMethod.call(openCallbackRef, errorCode == null ? xmlData : null, errorCode);
//         }

//         function preLoginHTTPCompletion(xmlData, errorCode) {
//             var nonce = null;
//             if (errorCode == null && xmlData != null) {
//                 var xmlFirst = xmlData.childNodes[0];
//                 if (xmlFirst != null && xmlFirst.tagName == "features") {
//                     var canPlain = false;
//                     for (var i = 0; i < xmlFirst.childNodes.length; ++i) {
//                         var xmlFeature = xmlFirst.childNodes[i];
//                         if (xmlFeature.tagName == "nonce") {
//                             nonce = xmlFeature.firstChild.nodeValue;
//                         } else if (xmlFeature.tagName == "sasl" && params.loginMethod == "auto") {
//                             if (xmlFeature.firstChild.nodeValue == "CRAM-MD5" && typeof CRYDigesterMD5 == "function") {
//                                 params.loginMethod = "cram-md5";
//                             } else if (xmlFeature.firstChild.nodeValue == "PLAIN") {
//                                 canPlain = true;
//                             }
//                         }
//                     }
//                     if (params.loginMethod == "auto" && canPlain) {
//                         params.loginMethod = "plain";
//                     }
//                 }
//             }

//             if (params.fixedIP == "NO") {
//                 loginURL += "&DisableIPWatch=1";
//             }
//             if (params.useCookie == "NO") {
//                 loginURL += "&DisableUseCookie=1";
//             } else if (params.useCookie == "YES") {
//                 loginURL += "&EnableUseCookie=1";
//             }
//             if (params.x2auth == "YES") {
//                 loginURL += "&x2auth=1";
//             }
//             if (params.canUpdatePwd == "YES") {
//                 loginURL += "&canUpdatePwd=1";
//             }
//             if (params.getTimeout != null) asyncGetWaitInSeconds = parseInt(params.getTimeout);
//             if (typeof(params.version) == "string") {
//                 loginURL += "&version=" + params.version;
//             }

//             var httpAuthUserName = null,
//                 httpAuthPassword = null;
//             if (errorCode != null) {} else if (params.loginMethod == "guest") {
//                 loginURL += "&loginAsGuest=1";

//             } else if (typeof(params.userName) != "string") {
//                 errorCode = "XIMSS 'userName' is not specified";

//             } else if (params.loginMethod == "sessionid") {
//                 if (typeof(params.sessionid) != "string") {
//                     errorCode = "XIMSS 'sessionid' is not specified";
//                 } else {
//                     loginURL += "&userName=" + encodeURIComponent(params.userName) + "&sessionid=" + encodeURIComponent(params.sessionid);
//                     if (params.killOldSession) loginURL += "&killOld=1"; // @1.0.33
//                 }

//             } else if (typeof(params.password) != "string") {
//                 errorCode = "XIMSS 'password' is not specified";

//             } else if (params.loginMethod == "plain") {
//                 loginURL += "&userName=" + encodeURIComponent(params.userName) + "&password=" + encodeURIComponent(params.password);

//             } else if (params.loginMethod == "cram-md5") {
//                 if (typeof(nonce) != "string") {
//                     errorCode = "XIMSS 'nonce' is missing from the server prompt";
//                 } else {
//                     loginURL += "&userName=" + encodeURIComponent(params.userName) + "&nonce=" + encodeURIComponent(nonce) + "&authData=" + (new CRYDigesterMD5()).cramBase64(params.password, nonce);
//                 }

//             } else if (params.loginMethod == "auth") {
//                 httpAuthUserName = params.userName;
//                 httpAuthPassword = params.password;

//             } else if (params.loginMethod == "auto") {
//                 errorCode = "no supported XIMSS login methods";

//             } else {
//                 errorCode = "illegal XIMSS login method";
//             }

//             if (errorCode == null) {
//                 self.startHTTPRequest(loginHTTPCompletion, null, "GET", loginURL, null, httpAuthUserName, httpAuthPassword);
//             } else {
//                 loginHTTPCompletion(null, errorCode);
//             }
//             return (null);
//         }

//         // constructor

//         if (typeof(params.serverName) != "string") return ("illegal XIMSS http binding parameters");
//         httpBaseURL = "http:";
//         if (useOldXDR) { // XDomainRequest can use the same schema only
//             httpBaseURL = window.location.protocol;
//         } else if (params.secureMode === "YES" || params.secureMode === true) {
//             httpBaseURL = "https:";
//         }
//         if (httpBaseURL == "https:" && params.loginMethod == "auto") {
//             params.loginMethod = "plain";
//         }

//         httpBaseURL += "//" + params.serverName + "/";
//         loginURL = httpBaseURL + "XIMSSLogin/?errorAsXML=1";

//         if (params.preSession != null) {
//             self.startHTTPRequest(preSessionHTTPCompletion, null, "POST", loginURL, "<XIMSS>" + params.preSession + "</XIMSS>");
//         } else if (params.loginMethod == "auto" || params.loginMethod == "cram-md5") {
//             self.startHTTPRequest(preLoginHTTPCompletion, null, "POST", loginURL, "<XIMSS><listFeatures id=\"list\" /></XIMSS>");
//         } else {
//             preLoginHTTPCompletion(null, null);
//         }
//         return (null);
//     }

//     var errorCode = params.binding == "HTTP" ? httpBinding() : "illegal binding";
//     if (errorCode != null && openCallbackMethod != null) scheduleDelayed(function() {
//         openCallbackMethod.call(openCallbackRef, null, errorCode);
//     }); // @1.0.26


//     //
//     // Callback Registry
//     //
//     function XIMSSListenerRegistry() {
//         var anyTag = null;
//         var tags = {};
//         var theReg = this;

//         theReg.registerCallback = function(newCallback, theTagName, theAttrName, theAttrValue) {
//             function canAssign(x, y) {
//                 return ((x == null) != (y == null));
//             }

//             if (theTagName == null) {
//                 if (theAttrName != null || theAttrValue != null) {
//                     return (false);
//                 }
//                 if (!canAssign(newCallback, anyTag)) {
//                     return (false);
//                 }
//                 anyTag = newCallback;

//             } else {
//                 var tagDescr = tags[theTagName];
//                 if (tagDescr == null) {
//                     if (newCallback == null) {
//                         return (false);
//                     }
//                     // creating a new tagDescr element
//                     tagDescr = tags[theTagName] = {};
//                     tagDescr.attrNames = null;
//                     tagDescr.anyAttr = null;
//                 }

//                 if (theAttrName != null) {
//                     var previous = null,
//                         attrNameDescr;
//                     for (;;) {
//                         attrNameDescr = previous == null ? tagDescr.attrNames : previous.next;
//                         if (attrNameDescr == null || attrNameDescr.name == theAttrName) break;
//                         previous = attrNameDescr;
//                     }
//                     if (attrNameDescr == null) {
//                         if (newCallback == null) {
//                             return (false);
//                         }
//                         attrNameDescr = {};
//                         attrNameDescr.next = null;
//                         attrNameDescr.name = theAttrName;
//                         attrNameDescr.values = {};
//                         attrNameDescr.nValues = 0;
//                         attrNameDescr.anyValue = null;

//                         if (previous == null) tagDescr.attrNames = attrNameDescr;
//                         else previous.next = attrNameDescr;
//                     }

//                     if (theAttrValue != null) {
//                         if (!canAssign(newCallback, attrNameDescr.values[theAttrValue])) {
//                             return (false);
//                         }
//                         if (newCallback != null) {
//                             attrNameDescr.values[theAttrValue] = newCallback;
//                             ++attrNameDescr.nValues;
//                         } else {
//                             delete attrNameDescr.values[theAttrValue];
//                             --attrNameDescr.nValues;
//                         }
//                     } else {
//                         if (!canAssign(newCallback, attrNameDescr.anyValue)) {
//                             return (false);
//                         }
//                         attrNameDescr.anyValue = newCallback;
//                     }
//                     // if all callbacks for this attribute have been removed -> remove the attribute
//                     if (attrNameDescr.anyValue == null && attrNameDescr.nValues === 0) {
//                         if (previous == null) tagDescr.attrNames = attrNameDescr.next;
//                         else previous.next = attrNameDescr.next;
//                     }
//                 } else {
//                     if (theAttrValue != null) return (false); // if theAttrName == null, then theAttrValue must be null, too.
//                     if (!canAssign(newCallback, tagDescr.anyAttr)) {
//                         return (false);
//                     }
//                     tagDescr.anyAttr = newCallback;
//                 }
//                 // if all callbacks for this tag have been removed -> remove the tag
//                 if (tagDescr.anyAttr == null && tagDescr.attrNames == null) {
//                     delete tags[theTagName];
//                 }
//             }
//             return (true);
//         };

//         theReg.callCallbacks = function(xmlData) {
//             var foundDescrs = [];

//             var tagDescr = tags[xmlData.tagName];
//             if (tagDescr != null) {
//                 for (var attrScan = tagDescr.attrNames; attrScan != null; attrScan = attrScan.next) {
//                     var attrValue = xmlData.getAttribute(attrScan.name);
//                     if (attrValue != null) {
//                         var valueCallback = attrScan.values[attrValue];
//                         if (valueCallback != null) foundDescrs.push(valueCallback);
//                         if (attrScan.anyValue != null) foundDescrs.push(attrScan.anyValue);
//                     }
//                 }
//                 if (tagDescr.anyAttr != null) foundDescrs.push(tagDescr.anyAttr);
//             }
//             if (anyTag != null) foundDescrs.push(anyTag);

//             // now, process all found in the proper order.
//             //  consider processed if retCode >= 0
//             //  stop processing    if retCode >  0
//             var processed = false;
//             while (foundDescrs.length !== 0) {
//                 var result = foundDescrs.shift()(xmlData);
//                 if (result == null || result >= 0) processed = true;
//                 if (result > 0) break;
//             }
//             return (processed);
//         };
//     }

// }

// XIMSSSession.prototype.getVersion = function() {
//     return ("1.0.33");
// };

// XIMSSSession.prototype.setCommonDebugFunction = function(newDebugObject, newDebugMethod) {
//     XIMSSSession.prototype.debugMethod = newDebugMethod;
//     XIMSSSession.prototype.debugObject = newDebugObject;
// };

// XIMSSSession.prototype.debugFunction = function(prefix, x, y) {
//     if (this.debugMethod != null) this.debugMethod.apply(this.debugObject, arguments);
//     else console.log(prefix + ": " + x + (y == null ? "" : (" " + y)));
// };

// //XIMSSSession.prototype.debugLog      = function(x,y) {this.debugFunction("XIMSS",x,y);};
// XIMSSSession.prototype.debugShowXML = true;
// XIMSSSession.prototype.debugIO = false;

// XIMSSSession.prototype.callback = function(theRef, theMethod) {
//     return function() {
//         return (theMethod.apply(theRef, arguments));
//     };
// };