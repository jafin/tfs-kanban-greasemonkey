// ==UserScript==
// @name       TFS Task Board Enhancements
// @namespace  jafin
// @version    0.2
// @description  Adds dynamic colouring to TFS tasks based on tags
// @include    http://*/tfs*board
// @grant       none
// ==/UserScript==

var $ = unsafeWindow.jQuery;

// add a global css style.
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function updateTasks() {
    var swimlane = 0;
    //count per lane.
    $("div.member-content").each(function () {
        var lanePoints = 0;
        var $this = $(this);
        $this.find("div.board-tile").each(function () {
            var $this = $(this);
            var text = $("div.value", $this).text();
            if (isNumber(text)) {
                lanePoints += parseInt(text);
            }
        });

        enhancedModel.swimlanes[swimlane] = lanePoints;

        //update column points
        var selector = 'div.points-total:eq(' + swimlane + ')';
        if ($('div.points-total').length == 0) {
            //tfs deleted our columns or they just don't exist yet..
            $('div.member-header-content').append('<div class="points-total"></div>');
        }
        $(selector).text(lanePoints);
        swimlane++;
    });

    //calculate some points
    $("div.content-container >div.cell:last")
        .find("div.board-tile").each(function () {
            var $this = $(this);
            var text = $("div.value", $this).text();
            if (isNumber(text)) {
                enhancedModel.storyPointsDone += parseInt(text);
            }
        });

    //Points todo.
    for (var key in enhancedModel.swimlanes) {
        if (key == enhancedModel.backlogColumnKey)
        {
            continue;
        }
            
        if (isNumber(enhancedModel.swimlanes[key]))
        {
            var num = parseInt(enhancedModel.swimlanes[key]);
            enhancedModel.storyPointsTotal += num;
        }
    }


    $("div.board-tile").each(function () {
        var $this = $(this);
        var $title = $('.title', this);
        var titleText = $title.text();
        $('span._tspTagCounter', this).each(function () {
            var $this = $(this);
            var titles = $this.attr('title');
            if (/BLOCKED/i.test(titles)) {
                $this.parent().addClass('board-tile-blocked');
            }
            if (/DEFECT/i.test(titles)) {
                $this.parent().addClass('board-tile-defect');
            }
        });
    });

    $('#storyPointsContainer').html('Story points total: ' + '<span class="points">' + enhancedModel.storyPointsTotal + '</span>'
        + ' Remaining: ' + '<span class="points">' + enhancedModel.storyPointsRemaining() + '</span>'
        + ' Done: ' + '<span class="points">' + enhancedModel.storyPointsDone + '</span>');
}

addGlobalStyle('.board-tile-defect { border-left: 12px solid #FFAA00 !important; background-color: #FFD47F !important;}');
addGlobalStyle('.board-tile-blocked { border-left: 12px solid #FF002A !important; background-color: #FFABB9 !important;}');
addGlobalStyle('#storyPointsContainer { color:white; font-weight:bold; margin-left:20px; float:left; padding-left:4px; padding-right:4px; background-color:#08395E;}');
addGlobalStyle('.points { color:yellow; font-weight:bold;}');
addGlobalStyle('#imageHolder { position:fixed; left:400px; top:200px; width:600px; height:600px;}');
addGlobalStyle('.points-total { color: #296401; float:right; background-color:#FBF2DC;padding-left:1px;padding-right:1px;}');

var enhancedModel = {};
enhancedModel.storyPointsDone = 0;
enhancedModel.storyPointsTotal = 0;
enhancedModel.storyPointsRemaining = function () {
    return enhancedModel.storyPointsTotal - enhancedModel.storyPointsDone;
    };
enhancedModel.backlogColumnKey = 0;  //ordinal number for backlog coloumn as we don't want to add storypoints from it into our totals.
enhancedModel.swimlanes = {};

$(document).ready(function () {
    $('div.member-header-content').append('<div class="points-total"></div>');
    $('div#header-row').append('<div id="storyPointsContainer"></div>');
    $('body').append('<div id="imageHolder"></div>');
    window.setTimeout(updateTasks, 5000);
});
