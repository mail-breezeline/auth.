function CRYDigesterMD5() {
    var byteCount, state0, state1, state2, state3;
    var block = new Array(64);
    var padding = new Array(64);

    function init() {
        byteCount = 0;
        state0 = 0x67452301;
        state1 = 0xefcdab89;
        state2 = 0x98badcfe;
        state3 = 0x10325476;
    }

    function set32Little(value, array, index) {
        array[index++] = value & 0xFF;
        array[index++] = (value >>> 8) & 0xFF;
        array[index++] = (value >>> 16) & 0xFF;
        array[index++] = (value >>> 24) & 0xFF;
    }

    function hexByte(x) {
        return ((x < 16 ? "0" : "") + x.toString(16));
    }

    function toHexString(byteArray) {
        var result = "";
        for (var i = 0; i < byteArray.length; ++i) result += hexByte(byteArray[i]);
        return (result.toLowerCase());
    }

    function toUnsigned(x) {
        return ((x + 0x100000000) % 0x100000000);
    }

    function lshift(x, s) {
        return ((x << s) | (x >>> (32 - s)));
    }

    function F(X, Y, Z) {
        return (toUnsigned((X & Y) | ((~X) & Z)));
    }

    function G(X, Y, Z) {
        return (toUnsigned((X & Z) | (Y & (~Z))));
    }

    function H(X, Y, Z) {
        return (toUnsigned(X ^ Y ^ Z));
    }

    function I(X, Y, Z) {
        return (toUnsigned(Y ^ (X | (~Z))));
    }

    function FF(a, b, c, d, x, s, ac) {
        return (toUnsigned(lshift(a + F(b, c, d) + x + ac, s) + b));
    }

    function GG(a, b, c, d, x, s, ac) {
        return (toUnsigned(lshift(a + G(b, c, d) + x + ac, s) + b));
    }

    function HH(a, b, c, d, x, s, ac) {
        return (toUnsigned(lshift(a + H(b, c, d) + x + ac, s) + b));
    }

    function II(a, b, c, d, x, s, ac) {
        return (toUnsigned(lshift(a + I(b, c, d) + x + ac, s) + b));
    }

    function toUTFArray(stringToEncode) {
        var utfText = [];
        for (var n = 0; n < stringToEncode.length; n++) {
            var code = stringToEncode.charCodeAt(n);
            if (code < 0x80) {
                utfText[utfText.length] = code;
            } else {
                var nBits = code < 0x00000800 ? 11 : code < 0x00010000 ? 16 : code < 0x00200000 ? 21 : code < 0x04000000 ? 26 : code < 0x80000000 ? 31 : 0;
                utfText[utfText.length] = ((0xFE << (nBits % 6)) & 0xFF) | (code >>> (Math.floor(nBits / 6) * 6));
                while (nBits >= 6) {
                    nBits = (Math.floor(nBits / 6) - 1) * 6;
                    utfText[utfText.length] = 0x80 + ((code >>> nBits) & 0x3F);
                }
            }
        }
        return (utfText);
    }
    this.updateString = function(stringToEncode) {
        this.updateArray(toUTFArray(stringToEncode));
    };
    this.updateArray = function(inputArray) {
        this.update(inputArray, inputArray.length);
    };
    this.update = function(inputArray, inputLength) {
        for (var i = 0; i < inputLength; ++i) {
            block[byteCount % 64] = inputArray[i];
            if (++byteCount % 64 == 0) {
                transformBlock();
            }
        }
    };
    this.finalDigest = function() {
        var bits = new Array(8);
        set32Little(byteCount * 8, bits, 0);
        set32Little(Math.floor(byteCount * 8 / 0x100000000), bits, 4);
        var index = byteCount % 64;
        this.update(padding, index < 56 ? (56 - index) : (120 - index));
        this.update(bits, 8);
        var digest = new Array(16);
        set32Little(state0, digest, 0);
        set32Little(state1, digest, 4);
        set32Little(state2, digest, 8);
        set32Little(state3, digest, 12);
        return (digest);
    };
    this.finalHexDigest = function() {
        return (toHexString(this.finalDigest()));
    };

    function transformBlock() {
        var a = state0,
            b = state1,
            c = state2,
            d = state3;
        var x = new Array(16);
        for (var j = 0; j < 16; ++j) x[j] = ((block[j * 4 + 3] * 256 + block[j * 4 + 2]) * 256 + block[j * 4 + 1]) * 256 + block[j * 4];
        a = FF(a, b, c, d, x[0], 7, 0xd76aa478);
        d = FF(d, a, b, c, x[1], 12, 0xe8c7b756);
        c = FF(c, d, a, b, x[2], 17, 0x242070db);
        b = FF(b, c, d, a, x[3], 22, 0xc1bdceee);
        a = FF(a, b, c, d, x[4], 7, 0xf57c0faf);
        d = FF(d, a, b, c, x[5], 12, 0x4787c62a);
        c = FF(c, d, a, b, x[6], 17, 0xa8304613);
        b = FF(b, c, d, a, x[7], 22, 0xfd469501);
        a = FF(a, b, c, d, x[8], 7, 0x698098d8);
        d = FF(d, a, b, c, x[9], 12, 0x8b44f7af);
        c = FF(c, d, a, b, x[10], 17, 0xffff5bb1);
        b = FF(b, c, d, a, x[11], 22, 0x895cd7be);
        a = FF(a, b, c, d, x[12], 7, 0x6b901122);
        d = FF(d, a, b, c, x[13], 12, 0xfd987193);
        c = FF(c, d, a, b, x[14], 17, 0xa679438e);
        b = FF(b, c, d, a, x[15], 22, 0x49b40821);
        a = GG(a, b, c, d, x[1], 5, 0xf61e2562);
        d = GG(d, a, b, c, x[6], 9, 0xc040b340);
        c = GG(c, d, a, b, x[11], 14, 0x265e5a51);
        b = GG(b, c, d, a, x[0], 20, 0xe9b6c7aa);
        a = GG(a, b, c, d, x[5], 5, 0xd62f105d);
        d = GG(d, a, b, c, x[10], 9, 0x2441453);
        c = GG(c, d, a, b, x[15], 14, 0xd8a1e681);
        b = GG(b, c, d, a, x[4], 20, 0xe7d3fbc8);
        a = GG(a, b, c, d, x[9], 5, 0x21e1cde6);
        d = GG(d, a, b, c, x[14], 9, 0xc33707d6);
        c = GG(c, d, a, b, x[3], 14, 0xf4d50d87);
        b = GG(b, c, d, a, x[8], 20, 0x455a14ed);
        a = GG(a, b, c, d, x[13], 5, 0xa9e3e905);
        d = GG(d, a, b, c, x[2], 9, 0xfcefa3f8);
        c = GG(c, d, a, b, x[7], 14, 0x676f02d9);
        b = GG(b, c, d, a, x[12], 20, 0x8d2a4c8a);
        a = HH(a, b, c, d, x[5], 4, 0xfffa3942);
        d = HH(d, a, b, c, x[8], 11, 0x8771f681);
        c = HH(c, d, a, b, x[11], 16, 0x6d9d6122);
        b = HH(b, c, d, a, x[14], 23, 0xfde5380c);
        a = HH(a, b, c, d, x[1], 4, 0xa4beea44);
        d = HH(d, a, b, c, x[4], 11, 0x4bdecfa9);
        c = HH(c, d, a, b, x[7], 16, 0xf6bb4b60);
        b = HH(b, c, d, a, x[10], 23, 0xbebfbc70);
        a = HH(a, b, c, d, x[13], 4, 0x289b7ec6);
        d = HH(d, a, b, c, x[0], 11, 0xeaa127fa);
        c = HH(c, d, a, b, x[3], 16, 0xd4ef3085);
        b = HH(b, c, d, a, x[6], 23, 0x4881d05);
        a = HH(a, b, c, d, x[9], 4, 0xd9d4d039);
        d = HH(d, a, b, c, x[12], 11, 0xe6db99e5);
        c = HH(c, d, a, b, x[15], 16, 0x1fa27cf8);
        b = HH(b, c, d, a, x[2], 23, 0xc4ac5665);
        a = II(a, b, c, d, x[0], 6, 0xf4292244);
        d = II(d, a, b, c, x[7], 10, 0x432aff97);
        c = II(c, d, a, b, x[14], 15, 0xab9423a7);
        b = II(b, c, d, a, x[5], 21, 0xfc93a039);
        a = II(a, b, c, d, x[12], 6, 0x655b59c3);
        d = II(d, a, b, c, x[3], 10, 0x8f0ccc92);
        c = II(c, d, a, b, x[10], 15, 0xffeff47d);
        b = II(b, c, d, a, x[1], 21, 0x85845dd1);
        a = II(a, b, c, d, x[8], 6, 0x6fa87e4f);
        d = II(d, a, b, c, x[15], 10, 0xfe2ce6e0);
        c = II(c, d, a, b, x[6], 15, 0xa3014314);
        b = II(b, c, d, a, x[13], 21, 0x4e0811a1);
        a = II(a, b, c, d, x[4], 6, 0xf7537e82);
        d = II(d, a, b, c, x[11], 10, 0xbd3af235);
        c = II(c, d, a, b, x[2], 15, 0x2ad7d2bb);
        b = II(b, c, d, a, x[9], 21, 0xeb86d391);
        state0 = toUnsigned(state0 + a);
        state1 = toUnsigned(state1 + b);
        state2 = toUnsigned(state2 + c);
        state3 = toUnsigned(state3 + d);
    }
    padding[0] = 0x80;
    for (var i = 1; i < 64; ++i) padding[i] = 0;
    init();
    this.cram = function(passwordString, cramKey) {
        var password = toUTFArray(passwordString);
        var paddedKey;
        if (password.length > 64) {
            this.update(password, password.length);
            paddedKey = this.finalDigest();
            init();
        } else {
            paddedKey = password;
        }
        for (var index = paddedKey.length; index < 64; ++index) paddedKey[index] = 0;
        for (var index = 0; index < 64; ++index) paddedKey[index] ^= 0x36;
        this.update(paddedKey, paddedKey.length);
        this.updateString(cramKey);
        var theDigest = this.finalDigest();
        init();
        for (var index = 0; index < 64; ++index) paddedKey[index] ^= (0x36 ^ 0x5C);
        this.update(paddedKey, paddedKey.length);
        this.update(theDigest, theDigest.length);
        return (this.finalHexDigest());
    };
    this.base64Encode = function(binary, padding) {
        var EncodeTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var result = "",
            index;
        for (index = 0; index + 3 <= binary.length; index += 3) {
            result += EncodeTable.substr(binary[index] >>> 2, 1) + EncodeTable.substr(((binary[index] << 4) & 0x30) | (binary[index + 1] >>> 4), 1) + EncodeTable.substr(((binary[index + 1] << 2) & 0x3C) | (binary[index + 2] >>> 6), 1) + EncodeTable.substr((binary[index + 2] & 0x3F), 1);
        }
        if (index < binary.length) {
            result += EncodeTable.substr(binary[index] >>> 2, 1);
            if (index + 1 < binary.length) {
                result += EncodeTable.substr(((binary[index] << 4) & 0x30) | (binary[index + 1] >>> 4), 1) + EncodeTable.substr(((binary[index + 1] << 2) & 0x3C), 1);
            } else {
                result += EncodeTable.substr(((binary[index] << 4) & 0x30), 1);
                if (padding) result + "=";
            }
            if (padding) result += "=";
        }
        return (result);
    };
    this.cramBase64 = function(passwordString, cramKey) {
        var resultString = this.cram(passwordString, cramKey);
        var resultArray = [];
        for (var x = 0; x < resultString.length; ++x) resultArray[x] = resultString.charCodeAt(x);
        return (this.base64Encode(resultArray, false));
    };
}