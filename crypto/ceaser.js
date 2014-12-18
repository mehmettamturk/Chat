var toChars = function (str) {
    return str.split('')
};

var fromChars = function (str) {
    return str.join('')
};

var shiftChar = function (char, alphabet, shift) {

    var mod = function (num, modulus) {
        return ((num % modulus) + modulus) % modulus;
    };

    return alphabet.charAt(mod(alphabet.indexOf(char) + shift, alphabet.length))
};

var caeserEncrypt = function (str, alphabet, shift) {
    return fromChars(
        toChars(str).
            map(function (char) {
                return shiftChar(char, alphabet, shift)
            })
    );
};

var caeserDecrypt = function (str, alphabet, shift) {
    return caeserEncrypt(str, alphabet, -shift)
};


module.exports = {
    caeserEncrypt: caeserEncrypt,
    caeserDecrypt: caeserDecrypt
};
