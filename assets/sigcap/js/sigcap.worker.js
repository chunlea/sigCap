onmessage = function(data) {
    data = data.data;
    if(data.op === 'set') {
        
    } else {
        postMessage({
            op: 'dat', 
            img: process(data.img)
        });
    }
};


var process = function(img) {
    var ret = gray2rgb(dynamicBinarize(grayScale(img)));
    return new ImageData(ret.data, ret.width, ret.height);
};

var grayScale = function(img) {
    var ret = {};
    ret.width = img.width;
    ret.height = img.height;
    ret.data = new Uint8ClampedArray(img.width * img.height);
    var len = ret.data.length;
    for(var i = 0; i < len; i ++) {
        ret.data[i] = img.data[i * 4] * 0.7 + img.data[i * 4 + 1] * 0.2 + img.data[i * 4 + 2] * 0.1;
    }
    return ret;
};

var binarize = function(img) {
    var ret = {};
    ret.width = img.width;
    ret.height = img.height;
    ret.data = new Uint8ClampedArray(img.width * img.height);
    var len = ret.data.length;
    var threshold = 127;
    for(var i = 0; i < len; i ++) {
        ret.data[i] = img.data[i] <= threshold ? 0 : 255;
    }
    return ret;
};

var dynamicBinarize = function(img) {
    var ret = {};
    ret.width = img.width;
    ret.height = img.height;
    ret.data = new Uint8ClampedArray(img.width * img.height);
    var wdw = [Math.floor(0.01 * ret.width), Math.floor(0.03 * ret.width), Math.floor(0.09 * ret.width), Math.floor(0.27 * ret.width)];
    var wdwWeight = [0.4, 0.3, 0.2, 0.1];
    var sum = new Uint32Array((img.width + 2) * (img.height + 2));
    var getIdx = function(x, y) {
        return x + y * ret.width;
    };
    var getPos = function(idx) {
        return [idx % ret.width, Math.floor(idx / ret.width)];
    };
    for(var y = 1; y <= ret.height; y ++) {
        for(var x = 1; x <= ret.width; x ++) {
            sum[getIdx(x, y)] =
                + sum[getIdx(x - 1, y)]
                + sum[getIdx(x, y - 1)]
                - sum[getIdx(x - 1, y - 1)]
                + img.data[getIdx(x - 1, y - 1)];
        }
    }
    var getAvg = function(x1, y1, x2, y2) {
        return (
                + sum[getIdx(x2 + 1, y2 + 1)]
                - sum[getIdx(x1, y2 + 1)]
                - sum[getIdx(x2 + 1, y1)]
                + sum[getIdx(x1, y1)]
        ) / (
            (x2 - x1 + 1) * (y2 - y1 + 1)
        );
    };
    var getThreshold = function(x, y, window) {
        var top = y - window;
        var right = x + window;
        var bottom = y + window;
        var left = x - window;
        if(top < 0) {
            top = 0;
        }
        if(right >= ret.width) {
            right = ret.width - 1;
        }
        if(bottom >= ret.height) {
            bottom = ret.height - 1;
        }
        if(left < 0) {
            left = 0;
        }
        return getAvg(left, top, right, bottom);
    }
    var globalThreshold = 0.7 * getAvg(0, 0, ret.width - 1, ret.height - 1) + 0.3 * 127;
    for(var y = 0; y < ret.height; y ++) {
        for(var x = 0; x < ret.width; x ++) {
            var idx = getIdx(x, y);
            var threshold = 0.8 * wdw.reduce(function(pre, cur, idx) {
                return pre +getThreshold(x, y, cur) * wdwWeight[idx];
            }) + 0.2 * globalThreshold;
            ret.data[idx] = img.data[idx] < threshold ? 0 : 255;
            //ret.data[idx] = threshold;
        }
    }
    return ret;
}

var gray2rgb = function(img) {
    var ret = {};
    ret.width = img.width;
    ret.height = img.height;
    ret.data = new Uint8ClampedArray(img.width * img.height * 4);
    var len = ret.data.length;
    for(var i = 0; i < len / 4; i ++) { 
        ret.data[i * 4 + 0] = img.data[i];
        ret.data[i * 4 + 1] = img.data[i];
        ret.data[i * 4 + 2] = img.data[i];
        ret.data[i * 4 + 3] = 255;
    }
    return ret;
};
