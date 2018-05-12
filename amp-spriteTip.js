var _imgUrl, _vttCues = [];
(function () {
    amp.plugin("spriteTip", function (options) {
        var player = this;
        player.addEventListener(amp.eventName.loadeddata, function () {
            GetThumbnailTrack(player);
        });
    });
}).call(this);
function GetThumbnailTrack(player) {
    var textTracks = player.textTracks();
    for (var i = 0; i < textTracks.length; i++) {
        var textTrack = textTracks[i];
        if (textTrack.src.indexOf(".vtt") > -1 && _vttCues.length == 0) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var vttUrl = textTrack.src;
                var vttData = xhr.responseText;
                ParseThumbnailTrack(player, vttUrl, vttData);
            };
            xhr.open("GET", textTrack.src, true);
            xhr.send();
        }
    }
}
function ParseThumbnailTrack(player, vttUrl, vttData) {
    var decoder = WebVTT.StringDecoder();
    var parser = new WebVTT.Parser(window, decoder);
    parser.oncue = function (cue) {
        if (cue.text.indexOf("#xywh=") > -1) {
            if (_imgUrl == null) {
                var imgUrl = vttUrl.split("/");
                var imgFile = cue.text.split("#")[0];
                imgUrl[imgUrl.length - 1] = imgFile.replace("./", "");
                _imgUrl = imgUrl.join("/");
            }
            if (_vttCues.length == 0) {
                InitializeSprite(player);
            }
            _vttCues.push(cue);
        }
    };
    parser.parse(vttData);
    parser.flush();
}
function InitializeSprite(player) {
    var seekBar = player.controlBar.progressControl.seekBar.el();
    var progressBar = player.controlBar.progressControl.el();
    seekBar.addEventListener("mousemove", function (e) {
        var timeSeconds = GetTimeSeconds(e, player);
        for (var i = 0; i < _vttCues.length; i++) {
            var cue = _vttCues[i];
            if (cue.startTime <= timeSeconds && cue.endTime >= timeSeconds) {
                var xywh = cue.text.split("=")[1].split(",");
                var imgSprite = document.getElementById("imgSprite");
                imgSprite.style.background = "url('" + _imgUrl + "') " + -xywh[0] + "px " + -xywh[1] + "px";
                imgSprite.style.width = xywh[2] + "px";
                imgSprite.style.height = xywh[3] + "px";
                imgSprite.style.top = -xywh[3] + "px";
                imgSprite.style.visibility = "visible";
            }
        }
    });
    progressBar.addEventListener("mouseout", function () {
        var imgSprite = document.getElementById("imgSprite");
        imgSprite.style.visibility = "hidden";
    });
    var imgSprite = document.createElement("img");
    imgSprite.id = "imgSprite";
    imgSprite.style.position = "absolute";
    seekBar.appendChild(imgSprite);
}
function GetTimeSeconds(e, player) {
    var seekBar = player.controlBar.progressControl.seekBar;
    var seekLeft = seekBar.el().getBoundingClientRect().left;
    var seekWidth = seekBar.width();
    var mouseOffset = (e.pageX - seekLeft) / seekWidth;
    var timeSeconds = player.duration() * mouseOffset;
    SetImageLeft(seekWidth, mouseOffset);
    return timeSeconds;
}
function SetImageLeft(seekWidth, mouseOffset) {
    var imgSprite = document.getElementById("imgSprite");
    var imgLeft = (seekWidth * mouseOffset) - (imgSprite.width / 2);
    if (imgLeft < 0) {
        imgLeft = 0;
    } else if (imgLeft + imgSprite.width > seekWidth) {
        imgLeft = seekWidth - imgSprite.width;  
    }
    imgSprite.style.left = imgLeft + "px";
}