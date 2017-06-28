/**
 * Created by eden90267 on 2017/6/28.
 */
$(function () {
    $('#clickMe').click(function () {
        var clickCounter = $('#clickCount');
        var count = parseInt(clickCounter.text(), 10);
        clickCounter.text(count + 1);
    })
});