/*jslint browser: true, regexp: true, plusplus: true */
(function() {
    "use strict";

    var page_images, page_i, page_image, browserName, version;

    function detectBrowser() {
        var userAgent = navigator.userAgent;
        if (userAgent.indexOf("MSIE") !== -1) {
            browserName = "ie";
            version = parseFloat(userAgent.substring(userAgent.indexOf('MSIE') + 4, userAgent.length));
        } else if (userAgent.indexOf("Trident") !== -1) {
            // IE since 9.0
            browserName = "ie";
            version = parseFloat(userAgent.substring(userAgent.indexOf('rv:') + 3, userAgent.indexOf('rv:') + 7));
        } else if (userAgent.indexOf("Firefox") !== -1) {
            browserName = "ff";
            version = parseFloat(userAgent.substring(userAgent.indexOf('Firefox') + 8, userAgent.length));
        } else if (userAgent.indexOf("Chrome") !== -1 || userAgent.indexOf("CriOS") !== -1) {
            browserName = "chrome";
        } else if (userAgent.indexOf("Safari") !== -1) {
            browserName = "safari";
            version = parseFloat(userAgent.substring(userAgent.indexOf('Version') + 8, userAgent.length));
        }
    }

    function isNotSupportedBrowser() {
        var isSupported = false;
        detectBrowser();

        if (browserName === "ie") {
            if (version > 9) {
                isSupported = true;
            }
        } else if (browserName === "ff") {
            if (version > 4) {
                isSupported = true;
            }
        } else if (browserName === "chrome") {
            isSupported = true;
        } else if (browserName === "safari") {
            if (version >= 5.1) {
                isSupported = true;
            }
        }
        return !isSupported;
    }

    document.canLogin = true;
    document.getElementById("pronto-login__ie_compatibility").style.display = 'none';
    if (isNotSupportedBrowser()) {
        document.getElementById("pronto-login").style.display = 'none';
        document.getElementById("pronto-login__not-supported-browser").style.display = 'block';

        if (browserName === "ie") {
            if (version < 9) {
                document.getElementById("pronto-login__ie_compatibility").style.display = 'block';
                document.getElementById("pronto-login_not-supported_text-link-id").style.display = 'none';
                document.canLogin = false;
            }
        }

        // restore image correct 'src' attribute (do not load them in supported browser)
        page_images = document.getElementsByTagName('img');
        for (page_i = 0; page_i < page_images.length; page_i = page_i + 1) {
            page_image = page_images[page_i];
            if (page_image.getAttribute("pre-src")) {
                page_image.setAttribute("src", page_image.getAttribute("pre-src"));
            }
        }
    }
    document.browserChecked = true;
})();