var abc = "abcdefghijklmnopqrstuvwxyz";
var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

module.exports = {
    DoPlayfair: DoPlayfair
};
