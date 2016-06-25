/*global define:false, Modernizr:false */

define([
    'jquery',
    'foundation',
     'foundation.abide',
     'foundation.accordion',
     'foundation.alert',
     //'foundation.clearing',
     //'foundation.dropdown',
     //'foundation.equalizer',
     //'foundation.interchange',
     //'foundation.joyride',
     //'foundation.magellan',
     //'foundation.offcanvas',
     //'foundation.orbit',
     'foundation.reveal',
     //'foundation.slider',
     //'foundation.tab',
     //'foundation.tooltip',
     'foundation.topbar'

], function ($) {
    'use strict';

    //console.log('foundation loader module is loaded');

    // bootstrap foundation
    $(document).foundation({
        accordion: {
            // specify the class used for accordion panels
            content_class: 'content',
            // specify the class used for active (or open) accordion panels
            active_class: 'active',
            // allow multiple accordion panels to be active at the same time
            multi_expand: true,
            // allow accordion panels to be closed by clicking on their headers
            // setting to false only closes accordion panels when another is opened
            toggleable: true
        }
    });




});