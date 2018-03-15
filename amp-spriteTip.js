var _imgUrl, _vttCues = [];
(function () {
    amp.plugin("spriteTip", function (options) {
        var player = this;
        player.addEventListener(amp.eventName.loadeddata, function () {
            GetThumbnailTrack(player, options);
        });
    });
}).call(this);
function GetThumbnailTrack(player, options) {
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
                var spriteImg = document.getElementById("spriteImg");
                spriteImg.style.background = "url('" + _imgUrl + "') " + xywh[0] + "px " + xywh[1] + "px";
                spriteImg.style.width = xywh[2] + "px";
                spriteImg.style.height = xywh[3] + "px";
                spriteImg.style.top = -xywh[3] + "px";
                spriteImg.style.visibility = "visible";
            }
        }
    });
    progressBar.addEventListener("mouseout", function () {
        var spriteImg = document.getElementById("spriteImg");
        spriteImg.style.visibility = "hidden";
    });
    var spriteImg = document.createElement("img");
    spriteImg.id = "spriteImg";
    spriteImg.style.position = "absolute";
    seekBar.appendChild(spriteImg);
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
    var spriteImg = document.getElementById("spriteImg");
    var imgLeft = (seekWidth * mouseOffset) - (spriteImg.width / 2);
    spriteImg.style.left = imgLeft + "px";
}