/*global define:false, Modernizr:false */
define(['jquery'], function ($) {
    'use strict';


    // Scroll to accordion on ipad and mobile
    $("[data-accordion]").on("click", ".accordion-navigation:not(.active)", function () {
      
        if (Foundation.utils.is_medium_only() || Foundation.utils.is_small_only()) {

            // Add extra container height in bottom so that the last element allows scrolling too
            var $this = $(this);
            var height = $(window).height() - $this.height();

            $(".extra-space").css("height", height);

            scrollToElement($this, 500);
        }  
        
    });

    var scrollToElement = function (el, ms) {
        var speed = (ms) ? ms : 600;
        $('html,body').animate({
            scrollTop: $(el).offset().top
        }, speed);
    }

    //$.fn.accordionAnimated = function () {

    //    var
    //      $accordion = this,
    //      $items = $accordion.find('> li'),
    //      $targets = $items.find('.content'),
    //      options = {
    //          active_class: 'active',  // class for items when active
    //          multi_expand: true,    // whether mutliple items can expand
    //          speed: 500,        // speed of animation
    //          toggleable: true      // setting to false only closes accordion panels when another is opened
    //      }
    //    ;

    //    $.extend(options, Foundation.utils.data_options($accordion));

    //    $items.each(function (i) {
    //        $(this).find('a:eq(0)').on('click.accordion', function () {
    //            if (!options.toggleable && $items.eq(0).hasClass(options.active_class)) {
    //                return;
    //            }

    //            $targets.eq(i)
    //              .stop(true, true)
    //              .slideToggle(options.speed);

    //            if (!options.multi_expand) {
    //                $targets.not(':eq(' + i + ')')
    //                  .stop(true, true)
    //                  .slideUp(options.speed);
    //            }
    //        });
    //    });
    //};

    //$('.accordion').accordionAnimated();


});