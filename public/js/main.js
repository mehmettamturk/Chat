var alphabet = "abcdefghijklmnopqrstuvwxyz";
var abc = "abcdefghijklmnopqrstuvwxyz";
var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

$(function() {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    var $loginPage = $('.login.page'); // The login page
    var $chatPage = $('.chat.page'); // The chatroom page

    var interval;
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    var socket = io();

    function addParticipantsMessage (data) {
        var message = '';
        if (data.numUsers == 0)
            return;

        if (data.numUsers === 1) {
            message += "1 Kullanıcı Çevrimiçi";
        } else {
            message += data.numUsers + " Kullanıcı Çevrimiçi";
        }
        log(message);
    }

    function updateUserList (data) {
        var markup = '';
        for (var name in data.usernames) {
            markup += '<p class="'+ name +'"><span></span>'+ name +'</p> '
        }
        $('.userList').html(markup);
    }

    function addUserToList (username) {
        $('.userList').append('<p class="'+ username +'"><span></span>'+ username +'</p> ');
    }

    function removeUserFromList (username) {
        var el = $('.' + username);
        el.remove();
    }

    function setUsername () {
        username = cleanInput($usernameInput.val().trim());

        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();

            socket.emit('add user', {
                username: username
                //crypto: $('input[name=crypto]:checked').val()
            });
        }
    }

    function sendMessage () {
        var message = $inputMessage.val();
        message = cleanInput(message);
        if (message && connected) {
            $inputMessage.val('');
            var key = prompt('Sifre gir:');
            message = DoPlayfair(message, ABC, key, 'E', 'Q');

            addChatMessage({
                username: username,
                message: message
            });

            socket.emit('new message', message);
        }
    }

    function log (message, options) {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    function addChatMessage (data, options) {
        var $typingMessages = $('.typing.message.' + data.username);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var typingClass = data.typing ? 'typing' : '';

        var time = setDate(data.time);
        var timeMarkup = time ? '<span class="time">' + time + '</span>' : '';

        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        data.message = data.message.replace(exp, "<a target='_blank' href='$1'>$1</a>");

        var messageMarkup = '<li class="message ' + data.username + ' ' + typingClass + '">' +
                                '<span class="username" style="color: '+ getUsernameColor(data.username) +'"> ' + data.username + ' </span>' +
                                '<span class="messageBody">' + data.message + '</span>' +
                                timeMarkup +
                            '</li>';

        var $messageDiv = $(messageMarkup);
        addMessageElement($messageDiv, options);
    }

    function setDate(time) {
        if (!time) return;
        var date = new Date(time);
        var todaysDate = new Date();

        var isToday = date.getUTCFullYear() == todaysDate.getUTCFullYear() &&
                      date.getUTCMonth() == todaysDate.getUTCMonth() &&
                      date.getUTCDate() == todaysDate.getUTCDate();

        var format = isToday ? "HH:MM" : "default";
        return date.format(format);
    }

    function addChatTyping (data) {
        data.typing = true;
        data.message = ' yazıyor.';
        addChatMessage(data);
    }

    function removeChatTyping (data) {
        $('.typing.message.' + data.username).fadeOut(function () {
            $(this).remove();
        });
    }

    function addMessageElement (el, options) {
        var $el = $(el);

        if (!options)
            options = {};

        if (typeof options.fade === 'undefined')
            options.fade = true;

        if (typeof options.prepend === 'undefined')
            options.prepend = false;

        if (options.fade)
            $el.hide().fadeIn(FADE_TIME);

        if (options.prepend)
            $messages.prepend($el);
        else
            $messages.append($el);

        $messages[0].scrollTop = $messages[0].scrollHeight;

        //$el.click(function(e) {
        //    var message = $(this).find('.messageBody').html();
        //    var key = prompt('Şifreyi Girin:');
        //
        //    alert($('input[name=crypto]:checked').val());
        //    var val = $('input[name=crypto]:checked').val();
        //    if (val == 'Ceaser')
        //        message = caeserDecrypt(message, alphabet, key);
        //    else if (val == 'Playfair')
        //        message = DoPlayfair(message, ABC, key, 'D', 'Q');
        //
        //    alert(message);
        //});
    }

    function cleanInput (input) {
        return $('<div/>').text(input).text();
    }

    function updateTyping () {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    function getUsernameColor (username) {
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }

        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    function setTitle (data) {
        document.title = data;
    }

    function playAudio (data) {
        var audioElement = document.createElement('audio');
        audioElement.setAttribute('src', data);
        audioElement.setAttribute('autoplay', 'autoplay');
        audioElement.load();

        audioElement.addEventListener("load", function() {
            audioElement.play();
        }, true);
    }

    $window.on("focus", function(e) {
        document.title = 'Chat';
        clearInterval(interval);
    });

    // Keyboard events
    $window.keydown(function (event) {
        if (!(event.ctrlKey || event.metaKey || event.altKey))
            $currentInput.focus();

        if (event.which === 13)
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
    });

    $inputMessage.on('input', function() {
        updateTyping();
    });

    // Click events
    $loginPage.click(function () {
        $currentInput.focus();
    });

    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    // Socket events
    socket.on('login', function (data) {
        connected = true;
        var message = "Hoşgeldiniz... ";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
        updateUserList(data)
    });

    socket.on('new message', function (data) {
        var key = prompt('Cozmek icin sifre gir:');
        data.message = DoPlayfair(data.message, ABC, key, 'D', 'Q');
        addChatMessage(data);
        playAudio('audio/newMessage.mp3');
        setTitle('Yeni Mesaj: ' + data.username);

        var flag = true;
        clearInterval(interval);
        interval = setInterval(function() {
            if (flag) {
                setTitle('Chat');
                flag = false;
            } else {
                setTitle('Yeni mesaj');
                flag = true;
            }
        }, 1000);
    });

    socket.on('user joined', function (data) {
        log(data.username + ' konuşmaya katıldı.');
        addParticipantsMessage(data);
        addUserToList(data.username);
        //playAudio('audio/newUser.mp3');
    });

    socket.on('user left', function (data) {
        log(data.username + ' konuşmadan ayrıldı.');
        addParticipantsMessage(data);
        removeChatTyping(data);
        removeUserFromList(data.username);
    });

    socket.on('typing', function (data) {
        addChatTyping(data);
    });

    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });
});


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


var MakeCipherABC = function(abc,key1)  {
    abc = abc.toUpperCase();
    key1 = key1.toUpperCase();
    var cyabc = key1+abc;

    for(var i = 0; i < abc.length; i++) {
        var letter = cyabc.charAt(i);
        var pos = cyabc.indexOf(letter,i+1);
        while(pos > -1) {
            cyabc = cyabc.substring(0,pos) + cyabc.substring(pos + 1, cyabc.length);
            pos = cyabc.indexOf(letter, i + 1);
        }
    };

    return cyabc;
};

var DoPlayfair = function(et, key1, abc, dir, dup) {
    et = et.toUpperCase();
    key1 = key1.toUpperCase();

    var pos = et.indexOf(" ");
    while (pos>-1) {
        et = et.substring(0,pos) + et.substring(pos + 1, et.length);
        pos = et.indexOf(" ");
    }

    pos = et.indexOf("?");
    while(pos>-1) {
        et = et.substring(0,pos) + et.substring(pos + 1, et.length);
        pos = et.indexOf("?");
    }

    var let1, let2;
    for(var i=0; i < et.length; i = i + 2) {
        let1 = et.charAt(i);
        let2 = et.charAt(i+1);
        if(let1 == let2) {
            et = et.substring(0, i+1) + "X" + et.substring(i + 1, et.length)
        }
    }

    if( (et.length % 2) == 1 ) {
        et += 'X';
    }

    if (dup != "") {
        pos = et.indexOf(dup);
        while(pos > -1) {
            et = et.substring(0,pos) + "I" + et.substring(pos + 1, et.length);
            pos = et.indexOf(dup);
        }
    }

    var cyabc = MakeCipherABC(abc, key1);
    var row = [];

    for (i = 0; i < 5; i++) {
        row[i] = ""
    }

    for (i = 0; i < 5; i++) {
        for(j = 0; j < 5; j++)
            row[i] += cyabc.charAt(5 * i + j);
    }

    var shf = 1;
    if (dir == "E")
        shf = 1;

    if (dir=="D")
        shf = 4;

    var dt = "";
    for(i = 0; i < et.length; i = i + 2) {
        var pos1 = cyabc.indexOf(et.charAt(i));
        var pos2 = cyabc.indexOf(et.charAt(i + 1));

        var x1 = pos1 % 5;
        var y1 = Math.floor(pos1 / 5);
        var x2 = pos2 % 5;
        var y2 = Math.floor(pos2 / 5);

        if (y1 == y2) {
            x1 = (x1 + shf) % 5;
            x2 = (x2 + shf) % 5
        } else if (x1 == x2) {
            y1 = (y1 + shf) % 5;
            y2 = (y2 + shf) % 5
        } else {
            var temp = x1;
            x1 = x2;
            x2 = temp
        }

        dt += row[y1].charAt(x1) + row[y2].charAt(x2) ;
    };

    return dt;
};
