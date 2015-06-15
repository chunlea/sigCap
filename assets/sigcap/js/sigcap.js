Webcam.set({
    width: 480,
    height: 270,
    
    dest_width: 1280,
    dest_height: 720,

    image_format: 'jpeg',
    jpeg_quality: 90
});

Webcam.attach('#cam');

$(document).ready(function() {
    var filteredCanvas = document.createElement('canvas');
    filteredCanvas.width = 1280;
    filteredCanvas.height = 720;
    var filteredCtx = filteredCanvas.getContext('2d');
    var previewCanvas = document.getElementById('preview');
    previewCanvas.width = 480;
    previewCanvas.height = 270;
    var previewCtx = previewCanvas.getContext('2d');

    var preX = 120;
    var preY = 67;
    var preW = 240;
    var preH = 135;

    worker = new Worker('assets/sigcap/js/sigcap.worker.js');
    worker.onmessage = function(data) {
        data = data.data;
        if(data.op === 'dat') {
            var w;
            var h;
            var t;
            var l;
            var s;
            var r = preW / preH;
            var cl = preX / 480 * 1280;
            var ct = preY / 270 * 720;
            var cw = preW / 480 * 1280;
            var ch = preH / 270 * 720;
            if(r > 16 / 9) {
                s = preW / 480;
                w = 416;
                h = 416 / r;
                t = 18 + (234 - h) / 2;
                l = 32;
            } else {
                s = preH / 270;
                w = 234 * r;
                h = 234;
                t = 18;
                l = 32 + (416 - w) / 2;
            }
            filteredCtx.putImageData(data.img, 0, 0);
            previewCtx.fillStyle = "white";
            previewCtx.fillRect(0, 0, 480, 270);
            previewCtx.save();
            previewCtx.drawImage((function() {
                var image = new Image();
	        image.src = filteredCanvas.toDataURL('image/png');
	        return image;
            })(), cl, ct, cw, ch, l, t, w, h);
            previewCtx.restore();
        }
        worker.busy = false;
    };
    worker.postImg = function(img) {
        if(worker.busy) {
            return ;
        }
        worker.busy = true;
        worker.postMessage({
            op: 'dat',
            img: img
        });
    }
    worker.busy = false;
    
    var oriCanvas = document.createElement('canvas');
    var final_width = Webcam.params.crop_width || Webcam.params.dest_width;
    var final_height = Webcam.params.crop_height || Webcam.params.dest_height;
    oriCanvas.width = final_width;
    oriCanvas.height = final_height;
    var oriCtx = oriCanvas.getContext('2d');
    
    setInterval(function() {
        if(Webcam.loaded) {
            Webcam.snap((function(ctx) {
                return function() {
                    var img = ctx.getImageData(0, 0, final_width, final_height);
                    worker.postImg(img);
                };
            })(oriCtx), oriCanvas);
        }
    }, 30);
    (function() {
        var startX = 0;
        var startY = 0;
        var endX = 0;
        var endY = 0;
        var clicked = false;
        var select = $('#select');
        var refreshSelect = function() {
            if(clicked) {
                select.css({
                    top: Math.min(startY, endY) + 'px',
                    left: Math.min(startX, endX) + 'px',
                    width: Math.abs(endX - startX) + 'px',
                    height: Math.abs(endY - startY) + 'px'
                });
            } else {
                select.css({
                    top: preY + 'px',
                    left: preX + 'px',
                    width: preW + 'px',
                    height: preH + 'px'
                });
            }
        }
        var selectStart = function(x, y) {
            clicked = true;
            startX = x;
            endX = x;
            startY = y;
            endY = y;
        };
        var selectEnd = function() {
            clicked = false;
            if((endX - startX) * (endY - startY) < 480 * 20) {
                console.log('Selection too small. ');
            } else {
                preX = Math.min(startX, endX);
                preY = Math.min(startY, endY);
                preW = Math.abs(endX - startX);
                preH = Math.abs(endY - startY);
            }
            refreshSelect();
        }
        $('#crop').on({
            mousedown: function(e) {
                selectStart(e.offsetX, e.offsetY);
            }, 
            mouseup: function() {
                if(clicked) {
                    selectEnd();
                }
            }, 
            mouseleave: function() {
                if(clicked) {
                    selectEnd();
                }
            },
            mousemove: function(e) {
                var tmp;
                endX = e.offsetX;
                endY = e.offsetY;
                refreshSelect();
            }
        });
    })();
});
