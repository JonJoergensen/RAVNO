/*globals requirejs:false, window:false */

requirejs([
    'jquery',
    'foundation-loader',
    'login',
    'fares',
    'accordion',
    'fastclick'
], function ($) {
    'use strict';

    var onReady, onResize, afterResize, timer;

    /* Hookups
    ----------------------------*/
    onReady = function (Fastclick) {
        //       
        // $(document).foundation('reveal', 'reflow');

         FastClick.attach(document.body);


    };

    onResize = function () {
        //
    };

    afterResize = function () {
        //
    };


    /* Attach events
    ----------------------------*/
    $(onReady); //Document ready
    $(window).resize(function () {
        onResize();
        clearTimeout(timer);
        timer = setTimeout(afterResize, 50);
    });




});
