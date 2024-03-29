(function ($) {
    "use strict";

    /**
	* Extend the jQuery with the method adcStatementList
	* Should be call on the container of the statement list
	*
	*     // Single closed question
	*     $('#adc_1').adcStatementList({
	*         iterations : [
	*           { id : 'U1', caption : "Iteration 1" },
	*           { id : 'U3', caption : "Iteration 2" },
	*           { id : 'U5', caption : "Iteration 3" }
	*         ]
	*     });
	*
	*     // Multi-coded question
	*     $('#adc_1').adcStatementList({
	*         isMultiple : true,
	*         iterations : [
	*           { id : 'L1', caption : "Iteration 1" },
	*           { id : 'L3', caption : "Iteration 2" },
	*           { id : 'L5', caption : "Iteration 3" }
	*         ]
	*     });
	*
	* @param {Object} options Statements list parameters
	* @param {Array}  options.iterations Array which contains the definition of iterations
	* @param {String} options.iterations[].id Id or name of the input which contains the value of the current iteration
	* @param {String} options.iterations[].caption Caption of the current iteration
	* @param {Boolean} [options.isMultiple] Indicates if the question is multiple
	* @return {jQuery} Returns the current instance of the root container for the call chains
	*/
    $.fn.adcGrid = function adcGrid(options) {

        // MS: Syntax to set the default value or use the one specified
        (options.width = options.width || 400);
        (options.height = options.height || "auto");
        (options.imageAlign = options.imageAlign || 'left');
        (options.loading = options.loading || 'Loading $prct'); // remove
        (options.scaleOnTarget = options.scaleOnTarget || 0.5);
        (options.originLocation = options.originLocation || 'bottomLeft' );
        (options.currentQuestion = options.currentQuestion || '');

        // Delegate .transition() calls to .animate() if the browser can't do CSS transitions.
        if (!$.support.transition) $.fn.transition = $.fn.animate;

        $(this).css({'max-width':options.maxWidth,'width':options.controlWidth});
        $(this).parents('.controlContainer').css({'width':'100%'});

        if ( options.controlAlign === "center" ) {
            $(this).parents('.controlContainer').css({'text-align':'center'});
            $(this).css({'margin':'0px auto'});
        } else if ( options.controlAlign === "right" ) {
            $(this).css({'margin':'0 0 0 auto'});
        }

        // IE8 and below fix
        if (!Array.prototype.indexOf) {

            Array.prototype.indexOf = function(elt /*, from*/) {
                var len = this.length >>> 0;

                var from = Number(arguments[1]) || 0;
                from = (from < 0)
                    ? Math.ceil(from)
                : Math.floor(from);
                if (from < 0)
                    from += len;

                for (; from < len; from++) {
                    if (from in this && this[from] === elt)
                        return from;
                }
                return -1;
            };
        }

        // Global variables
        var $container = $(this),
            currentIteration = 0,
            autoForward = options.autoForward,
            clickActive = false,
            autoImageSize = Boolean(options.autoImageSize),
            stackResponses = Boolean(options.stackResponses),
            valuesArray = [],
            exclusiveArray = String(options.exclusiveAreas).split(','),
            exclusiveAreas = false,
            selectNextResponse = Boolean(options.selectNextResponse),
            initZindex = 100,
            removingItem = false,
            autoStackWidth = options.autoStackWidth,
            dragCheck = false,
            scaleOnTarget = options.scaleOnTarget,
            total_images = $container.find("img").length,
            images_loaded = 0,
            items = options.items,
            gridSquares = Number(options.gridSquares),
            cellSize = 0,
            dropAreaContainerWidthHeight = options.dropAreaContainerWidthHeight,
            hideLabels = Boolean(options.hideLabels),
            hideLabelsMobile = Boolean(options.hideLabelsMobile),
            col = 0,
            row = 0,
            x = 0,
            y = 0,
            cellBorderWidth = 0,
            responseFontSize = parseInt(options.responseFontSize) * scaleOnTarget,
            responseFontUnits = options.responseFontSize.split(responseFontSize)[1],
            originLocation = options.originLocation;

        // check for mobile or reduced screen size
        if( (/iPhone|iPod|iPad|Android|BlackBerry/).test(navigator.userAgent) || $(window).width() <= 480 ) {
            // resize start area to max space
            //resize grid to max space
            stackResponses = true;
            $(this).css({'width':'100%'});
            $('.gridOuter, .gridInner, .startArea').css({'width':'100%'}).width('100%');
            if ( hideLabelsMobile || hideLabels  ) {
                hideLabels = true;
                $('.axisLabel').css({'visibility':'hidden'}).width(0).height(0).hide();
            }
            $('.gridOuter').width( $(this).width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20)
                .height( $(this).width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20);
            $('.gridInner').width( $('.gridOuter').height() - 40)
                .height( $('.gridOuter').width() - 40);
            if ( !hideLabelsMobile ) {
                $('.axisLabel.top, .axisLabel.bottom').width( $('.gridOuter').width() );
                $('.axisLabel.left, .axisLabel.right').height( $('.gridOuter').height() );
            }
            $('.gridOuter').css({'marginBottom': $('.axisLabel.top').height() + $('.axisLabel.bottom').height() + 40 + 'px','width':'100%','float':'none'});
            dropAreaContainerWidthHeight = $('.gridOuter').width();
            $('.startArea').width('100%').css({'marginBottom':'20px','text-align':'center','float':'none'});
            $('.responseItem').css({'marginLeft':'auto','marginRight':'auto','float':'none'});
            scaleOnTarget = 0.2;
            if ( !hideLabelsMobile ) {
                // Find biggest label width
                if ( $(".axisLabel.right").outerWidth() > $(".axisLabel.left").outerWidth() ) {
                    $('.gridOuter').css('margin-left', $(".axisLabel.left").outerWidth() + 10 + "px");
                } else {
                    $('.gridOuter').css('margin-right', $(".axisLabel.right").outerWidth() + 10 + "px");
                }

            }

        }
        // fix dropAreaContainerWidthHeight if it's a percentage
        $('.gridOuter').width( dropAreaContainerWidthHeight );
        dropAreaContainerWidthHeight = $('.gridOuter').width();

        if ( hideLabels ) {
            $('.axisLabel').hide();
            $('.gridOuter').width( dropAreaContainerWidthHeight )
                .height( dropAreaContainerWidthHeight );
        } else {
            $('.gridOuter').width( dropAreaContainerWidthHeight - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20)
                .height( dropAreaContainerWidthHeight - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20);
        }
        $('.gridInner').width( $('.gridOuter').height() - 40)
            .height( $('.gridOuter').width() - 40);

        cellSize = Math.floor( $('.gridInner').width() / gridSquares );

        $('.gridCell').each(function(i,e) {
            cellBorderWidth = ($(this).outerWidth() - $(this).width()) / 2,
                cellSize = ($('.gridInner').width() / gridSquares ) - (cellBorderWidth),
                x = col * cellSize,
                y = row * cellSize;

            $(this).width( cellSize ).height( cellSize ).css({'top':(y + (row*cellBorderWidth))+'px','left':(x + (col*cellBorderWidth))+'px'});
            col++;
            if ( row === gridSquares - 1 ) $(this).addClass('lastRow');
            if ( col == gridSquares ) {
                $(this).addClass('lastCol');
                col = 0;
                row++;
            }
        });

        // Position Labels
        if ( !hideLabels ) {
            $('.gridOuter').css('top',($('.axisLabel.top').outerHeight() + 10) + 'px');
            $('.axisLabel.top, .axisLabel.bottom').width( $('.gridOuter').width() );
            $('.axisLabel.bottom').css('bottom', (0 - $('.axisLabel.top').outerHeight() - 10) + 'px');
            $('.axisLabel.top').css('top', (- 10 - $('.axisLabel.top').outerHeight()) + 'px');
            $('.axisLabel.right').css('right', (0 - $('.axisLabel.right').outerWidth() - 10) + 'px');
            /*$('.gridOuter').css('right',($('.axisLabel.right').outerWidth() + 10) + 'px');*/
            $('.axisLabel.left').css('left', (0 - $('.axisLabel.left').outerWidth() - 10) + 'px');

            $('.axisLabel.right .labelTxt').css('top', (($('.gridOuter').height()*0.5) - ($('.axisLabel.right .labelTxt').outerHeight()*0.5)) + 'px');
            $('.axisLabel.left .labelTxt').css('top', (($('.gridOuter').height()*0.5) - ($('.axisLabel.left .labelTxt').outerHeight()*0.5)) + 'px');
        }

        if ( autoStackWidth !== '' ) {
            if ( $(this).parents('.controlContainer').width() <= parseInt(autoStackWidth) ) stackResponses = true;
        }

        // Fix counters
        var $leftPos = parseInt($('.gridOuter').css('border-left-width')) + $('.xCounter').width();

        // IF IE8
        if (!Modernizr.csstransforms) {
            $leftPos += $('.xCounter').width();
            $('.xCounter.top, .yCounter.left').css({'visibility':'hidden'});
        }

        $('.xCounter').css({
            'top':-$leftPos+'px',
            'left':0+'px',
            opacity: 0
        });

        $('.xCounter.bottom').css({
            'top':$('.gridOuter').outerWidth()+'px',
            'left':0+'px',
            opacity: 0
        });


        var $topPos = parseInt($('.gridInner').css('border-top-width')) + $('.yCounter').height();
        $('.yCounter').css({
            'top':0+'px',
            'left':-$topPos+'px',
            opacity: 0
        });
        $('.yCounter.right').css({
            'top':0+'px',
            'left':$('.gridOuter').outerHeight()+'px',
            opacity: 0
        });

        $('.xCounter').data({

            'startX': parseInt($('.xCounter').css('left')),
            'endX': $('.gridInner').width(),
            'Y': parseInt($('.xCounter').css('top'))
        });

        function mouseFollow(e) { // mouseFollow() is called whenever the mouse enters a nav slider, id assigned to be slidePrev or slideNext

            var startXPos = $('.gridInner').offset().left,
                endXPos   = $('.gridInner').outerWidth(),
                xLength   = endXPos,
                startYPos = $('.gridInner').offset().top,
                endYPos   = $('.gridInner').outerHeight(),
                yLength   = endYPos,
                adjustmentX = (xLength - $('.xCounter').width()) / xLength,
                adjustmentY = (yLength - $('.yCounter').height()) / yLength,
                $offSetLeft = $('.gridInner').offset().left,
                $offSetTop =  $('.gridInner').offset().top,
                $newPosX = ((e.pageX - $offSetLeft) * adjustmentX) + $('.xCounter').width(),
                $newPosY = ((e.pageY - $offSetTop) * adjustmentY) + $('.yCounter').height();

            if (!Modernizr.csstransforms) {

            }

            //Counter numbers
            var $x =  Math.round( ( (e.pageX - $offSetLeft)/xLength ) * gridSquares ),
                $y =  Math.round( ( (e.pageY - $offSetTop)/yLength ) * gridSquares );

            // Adjust numbers
            $x = $x - (gridSquares * 0.5);
            $y = (gridSquares * 0.5) - $y;

            $('.xCounter').css({ left: ($newPosX-1)+'px' });
            $('.yCounter').css({ top: ($newPosY-1)+'px' });
            /*m*/
            if ( originLocation === 'bottomLeft' ) {
                $('.xCounter .counterTxt').html($x + (gridSquares * 0.5));
                $('.yCounter .counterTxt').html($y + (gridSquares * 0.5));
            } else {
                $('.xCounter .counterTxt').html($x);
                $('.yCounter .counterTxt').html($y);
            }
            /*if ( originLocation === 'bottomLeft' ) {
					items[($('.responseActive').data('index')*2)].element.val(xVal);
					items[($('.responseActive').data('index')*2)+1].element.val(gridSquares - yVal);
				} else {
					items[($('.responseActive').data('index')*2)].element.val(xVal - (gridSquares * 0.5));
					items[($('.responseActive').data('index')*2)+1].element.val((gridSquares * 0.5) - yVal);
				}*/
        }

        // Initialise droppable
        $( ".gridInner" ).droppable({
            //activate: function( event, ui ) { dragging = true },
            tolerance: "pointer",
            drop: function( event, ui ) {

                //dragging = false;

                var x = event.pageX - $('.gridInner').offset().left,
                    y = event.pageY - $('.gridInner').offset().top;

                // Calculate values
                x =  Math.round( ( x/$( ".gridInner" ).width() ) * gridSquares );
                y =  Math.round( ( y/$( ".gridInner" ).height() ) * gridSquares );

                // Write values
                if ( originLocation === 'bottomLeft' ) {
                    items[($(ui.draggable).data('index')*2)].element.val(x);
                    items[($(ui.draggable).data('index')*2)+1].element.val(gridSquares - y);
                } else {
                    items[($(ui.draggable).data('index')*2)].element.val(x - (gridSquares * 0.5));
                    items[($(ui.draggable).data('index')*2)+1].element.val((gridSquares * 0.5) - y);
                }

                $(ui.draggable).data({'revertX':$(ui.draggable).position().left,'revertY':$(ui.draggable).position().top});

                // IF IE8
                if (!Modernizr.csstransforms) {

                    // Resize image the oldfashioned way
                    var maxItemScale = scaleOnTarget,
                        nImageWidth = Math.round($(ui.draggable).find('img').data('owidth') * scaleOnTarget) + "px",
                        nImageHeight = Math.round($(ui.draggable).find('img').data('oheight') * scaleOnTarget) + "px",
                        nImagePaddingT = Math.round(parseInt($(ui.draggable).find('img').css('padding-top')) * scaleOnTarget) + "px",
                        nImagePaddingR = Math.round(parseInt($(ui.draggable).find('img').css('padding-right')) * scaleOnTarget) + "px",
                        nImagePaddingB = Math.round(parseInt($(ui.draggable).find('img').css('padding-bottom')) * scaleOnTarget) + "px",
                        nImagePaddingL = Math.round(parseInt($(ui.draggable).find('img').css('padding-left')) * scaleOnTarget) + "px",
                        nTxtPaddingT = Math.round(parseInt($(ui.draggable).find('.responseText').css('padding-top')) * scaleOnTarget) + "px",
                        nTxtPaddingR = Math.round(parseInt($(ui.draggable).find('.responseText').css('padding-right')) * scaleOnTarget) + "px",
                        nTxtPaddingB = Math.round(parseInt($(ui.draggable).find('.responseText').css('padding-bottom')) * scaleOnTarget) + "px",
                        nTxtPaddingL = Math.round(parseInt($(ui.draggable).find('.responseText').css('padding-left')) * scaleOnTarget) + "px",
                        nWidth = Math.round(parseInt($(ui.draggable).data('owidth')) * scaleOnTarget),
                        nheight = Math.round(parseInt($(ui.draggable).data('oheight')) * scaleOnTarget),
                        nPaddingT = Math.round(parseInt($(ui.draggable).css('padding-top')) * scaleOnTarget) + "px",
                        nPaddingR = Math.round(parseInt($(ui.draggable).css('padding-right')) * scaleOnTarget) + "px",
                        nPaddingB = Math.round(parseInt($(ui.draggable).css('padding-bottom')) * scaleOnTarget) + "px",
                        nPaddingL = Math.round(parseInt($(ui.draggable).css('padding-left')) * scaleOnTarget) + "px",
                        nY = ($(ui.draggable).offset().top + (parseInt($(ui.draggable).data('oheight'))*0.5)) - (nheight*0.5),
                        nX = ($(ui.draggable).offset().left + (parseInt($(ui.draggable).data('owidth'))*0.5)) - (nWidth*0.5);

                    if ( parseInt($(ui.draggable).css('width')) != nWidth ) {
                        $(ui.draggable).find('.response_text').css({'font-size':responseFontSize});
                        $(ui.draggable).find('img').css({
                            'width':nImageWidth,
                            'height':nImageHeight,
                            'padding':nImagePaddingT + " " + nImagePaddingR + " " + nImagePaddingB + " " + nImagePaddingL
                        });
                        $(ui.draggable).find('.response_text').css({
                            'font-size':responseFontSize + responseFontUnits,
                            'padding':nTxtPaddingT + " " + nTxtPaddingR + " " + nTxtPaddingB + " " + nTxtPaddingL
                        }).hide();
                        $(ui.draggable).offset({top:nY,left:nX});
                        $(ui.draggable).css({
                            'width':nWidth,
                            'height':nheight,
                            'padding':nPaddingT + " " + nPaddingR + " " + nPaddingB + " " + nPaddingL
                        });
                    }

                } else {

                    $( ui.draggable ).transition({ scale: scaleOnTarget, 'z-index': 1 }, options.animationSpeed);

                }

                // Set value to card?
                $( ui.draggable ).draggable(
                    options, {
                        revert: function(valid) {
                            if(valid) {
                                //Dropped in a valid location
                            }
                            else {
                                $(ui.draggable).animate({"left": $(ui.draggable).data('revertX'), "top": $(ui.draggable).data('revertY')}, "slow");
                                //Dropped in an invalid location
                            }
                            //return !valid;
                        },
                        cursorAt: {
                            /*top:(!Modernizr.csstransforms)?($(ui.draggable).outerHeight()/2):(parseInt($(ui.draggable).data('oheight'))/2),
							left:(!Modernizr.csstransforms)?($(ui.draggable).outerWidth()/2):(parseInt($(ui.draggable).data('owidth'))/2)*/
                            top:(!Modernizr.csstransforms)?($(ui.draggable).outerHeight()/2):($(ui.draggable).outerHeight()/2),
                            left:(!Modernizr.csstransforms)?($(ui.draggable).outerWidth()/2):($(ui.draggable).outerWidth()/2)
                        },
                        zIndex: 9999,
                        drag: function(){
                            dragCheck = true;
                        },
                        stop: function(){
                            dragCheck = false;
                        }
                    }
                );

                $( ui.draggable ).attr({'data-value':$(this).data('index'),'data-ontarget':'true'});

                $('.xCounter, .yCounter').transition({ opacity: 0 });
                $('html').off("mousemove");

                if ( stackResponses ) {
                    $('.responseItem[data-ontarget=false]').hide();
                    $('.responseItem[data-ontarget=false]').first().show();
                }

                // Select next reponse
                if ( selectNextResponse ) {
                    $('.responseActive').removeClass('responseActive');
                    clickActive = false;
                    $('.innerTarget').remove();
                    $('.startArea').off('click');

                    $('.responseItem[data-ontarget=false]').first().addClass('responseActive');
                    clickActive = true;

                    $('.gridOuter').append('<div class="innerTarget gridInner"><table class="bottom" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" width="50%"></td><td class="tr" width="50%"></td></tr><tr><td class="bl"></td><td class="br"></td></tr></table><table class="top" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" height="25%" colspan="2" valign="top" align="center">' + $('.axisLabel.top .labelTxt').text() + '</td></tr><tr><td class="tr" width="50%" height="50%" align="left">' + $('.axisLabel.left .labelTxt').text() + '</td><td width="50%" height="50%" align="right">' + $('.axisLabel.right .labelTxt').text() + '</td></tr><tr><td class="bl"height="25%" colspan="2" valign="bottom" align="center">' + $('.axisLabel.bottom .labelTxt').text() + '</td></tr></table></div>');
                    // IF IE7/8
                    if (!Modernizr.csstransforms) {
                        $('.innerTarget .bottom').hide();
                    }
                    if ( !hideLabels ) $('.innerTarget .top td').css('background','#000').css('opacity','.1').text('');

                    $('.innerTarget').on('click', function(e) {
                        setTarget(e);
                    }).width($('.gridInner').outerWidth()).height($('.gridInner').outerHeight());
                    $('.startArea').on('click', function(e) {
                        setTarget(e);
                    });
                }
                if (window.askia
                    && window.arrLiveRoutingShortcut
                    && window.arrLiveRoutingShortcut.length > 0
                    && window.arrLiveRoutingShortcut.indexOf(options.currentQuestion) >= 0) {
                    askia.triggerAnswer();
                }

            },
            over: function( event, ui ) {

                $('.xCounter, .yCounter').transition({ opacity: 1 });

                $('html').on("mousemove", function(e){
                    mouseFollow(e);
                }).on(mouseFollow(event));

            },
            out: function( event, ui ) {

                $('.xCounter, .yCounter').transition({ opacity: 0 });
                $('html').off("mousemove");

            }

        });

        function setTarget(e/*e, target*/) {

            if ( $(e.target).hasClass('startArea') ) {

                $('.innerTarget').remove();

                if ( $('.responseActive').data('index') != null ) {
                    $('.responseActive').attr({'data-value':'','data-ontarget':'false'});

                    // IF IE8
                    if (!Modernizr.csstransforms) {
                        var ratio = $('.responseActive').width() / $('.responseActive').data('owidth');
                        $('.responseActive').width( $('.responseActive').data('owidth') ).height( $('.responseActive').data('oheight') ).css('padding',$('.responseActive').data('opadding') );
                        $('.responseActive img').width( $('.responseActive img').data('owidth') ).height( $('.responseActive img').data('oheight') ).css('padding', '' );
                        $('.responseActive .response_text').css({'font-size' : $('.responseActive').data('ofontsize'),'padding' : '' });
                        $('.responseActive').transition({ top:$('.responseActive').data('top'), left:$('.responseActive').data('left') }, options.animationSpeed);

                    } else {
                        $('.responseActive').transition({ scale: 1, top:$('.responseActive').data('top'), left:$('.responseActive').data('left') }, options.animationSpeed);

                    }

                    // Write values
                    items[($('.responseActive').data('index')*2)].element.val('');
                    items[($('.responseActive').data('index')*2)+1].element.val('');

                    $('.responseActive').removeClass('responseActive');
                    clickActive = false;
                    $('.startArea').off('click');
                }

            } else  if ( $(e.delegateTarget).hasClass('innerTarget') ) {

                $('.responseActive').attr({'data-ontarget':'true'});

                $('.innerTarget').remove();
                $('.startArea').off('click');

                $('.responseActive').transition({ scale:1 },0);

                var startXPos = $('.gridInner').offset().left,
                    endXPos   = $('.gridInner').outerWidth(),
                    xLength   = endXPos,
                    startYPos = $('.gridInner').offset().top,
                    endYPos   = $('.gridInner').outerHeight(),
                    yLength   = endYPos,
                    $offSetLeft = $('.gridInner').offset().left,
                    $offSetTop =  $('.gridInner').offset().top;

                //Counter numbers
                var xVal =  Math.round( ( (e.pageX - $offSetLeft)/xLength ) * gridSquares ),
                    yVal =  Math.round( ( (e.pageY - $offSetTop)/yLength ) * gridSquares );

                // Write values
                if ( originLocation === 'bottomLeft' ) {
                    items[($('.responseActive').data('index')*2)].element.val(xVal);
                    items[($('.responseActive').data('index')*2)+1].element.val(gridSquares - yVal);
                } else {
                    items[($('.responseActive').data('index')*2)].element.val(xVal - (gridSquares * 0.5));
                    items[($('.responseActive').data('index')*2)+1].element.val((gridSquares * 0.5) - yVal);
                }

                // IF IE8
                if (!Modernizr.csstransforms) {

                    var maxItemScale = scaleOnTarget,
                        topOrigin = $('.gridInner').offset().top,
                        leftOrigin = $('.gridInner').offset().left,
                        nImageWidth = Math.round($('.responseActive img').data('owidth') * scaleOnTarget) + "px",
                        nImageHeight = Math.round($('.responseActive img').data('oheight') * scaleOnTarget) + "px",
                        nImagePaddingT = Math.round(parseInt($('.responseActive img').css('padding-top')) * scaleOnTarget) + "px",
                        nImagePaddingR = Math.round(parseInt($('.responseActive img').css('padding-right')) * scaleOnTarget) + "px",
                        nImagePaddingB = Math.round(parseInt($('.responseActive img').css('padding-bottom')) * scaleOnTarget) + "px",
                        nImagePaddingL = Math.round(parseInt($('.responseActive img').css('padding-left')) * scaleOnTarget) + "px",
                        nTxtPaddingT = Math.round(parseInt($('.responseActive .responseText').css('padding-top')) * scaleOnTarget) + "px",
                        nTxtPaddingR = Math.round(parseInt($('.responseActive .responseText').css('padding-right')) * scaleOnTarget) + "px",
                        nTxtPaddingB = Math.round(parseInt($('.responseActive .responseText').css('padding-bottom')) * scaleOnTarget) + "px",
                        nTxtPaddingL = Math.round(parseInt($('.responseActive .responseText').css('padding-left')) * scaleOnTarget) + "px",
                        nWidth = Math.round(parseInt($('.responseActive').data('owidth')) * scaleOnTarget),
                        nheight = Math.round(parseInt($('.responseActive').data('oheight')) * scaleOnTarget),
                        nPaddingT = Math.round(parseInt($('.responseActive').css('padding-top')) * scaleOnTarget) + "px",
                        nPaddingR = Math.round(parseInt($('.responseActive').css('padding-right')) * scaleOnTarget) + "px",
                        nPaddingB = Math.round(parseInt($('.responseActive').css('padding-bottom')) * scaleOnTarget) + "px",
                        nPaddingL = Math.round(parseInt($('.responseActive').css('padding-left')) * scaleOnTarget) + "px",
                        x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) - (nWidth*0.5),
                        y = topOrigin + ((yVal/gridSquares) * $('.gridInner').outerHeight()) - (nheight*0.5);

                    $('.responseActive').offset({top:(y),left:(x)});

                    if ( parseInt($('.responseActive').css('width')) != nWidth ) {
                        $('.responseActive .response_text').css({'font-size':responseFontSize});
                        $('.responseActive img').css({
                            'width':nImageWidth,
                            'height':nImageHeight,
                            'padding':nImagePaddingT + " " + nImagePaddingR + " " + nImagePaddingB + " " + nImagePaddingL
                        });
                        $('.responseActive .response_text').css({
                            'font-size':responseFontSize + responseFontUnits,
                            'padding':nTxtPaddingT + " " + nTxtPaddingR + " " + nTxtPaddingB + " " + nTxtPaddingL
                        });
                        $('.responseActive').css({
                            'width':nWidth,
                            'height':nheight,
                            'padding':nPaddingT + " " + nPaddingR + " " + nPaddingB + " " + nPaddingL
                        });
                    }

                    $('.responseActive').draggable(
                        "option", {
                            cursorAt: {
                                /*top:(!Modernizr.csstransforms)?($('.responseActive').outerHeight()/2):(parseInt($('.responseActive').data('oheight'))/2),
									left:(!Modernizr.csstransforms)?($('.responseActive').outerWidth()/2):(parseInt($('.responseActive').data('owidth'))/2) */
                                top:(!Modernizr.csstransforms)?($('.responseActive').outerHeight()/2):($('.responseActive').outerHeight()/2),
                                left:(!Modernizr.csstransforms)?($('.responseActive').outerWidth()/2):($('.responseActive').outerWidth()/2)
                            }
                        }
                    );

                    $('.responseActive').removeClass('responseActive');
                    clickActive = false;

                } else {

                    var maxItemScale = scaleOnTarget,
                        topOrigin = $('.gridInner').offset().top,
                        leftOrigin = $('.gridInner').offset().left,
                        x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) - ($('.responseActive').outerWidth()*0.5),
                        y = topOrigin + ((yVal/gridSquares) * $('.gridInner').outerHeight()) - ($('.responseActive').outerHeight()*0.5);

                    $('.responseActive').offset({top:y/*(y - $('.responseActive').data('oheight')*0.5)*/,left:x/*(x - $('.responseActive').data('owidth')*0.5)*/});
                    $('.responseActive').transition({ scale:maxItemScale }, 0,function() {
                        $('.responseActive').removeClass('responseActive');
                        clickActive = false;
                    });

                }

            }

            if ( stackResponses ) {
                $('.responseItem[data-ontarget=false]').hide();
                $('.responseItem[data-ontarget=false]').first().show();
            }

            // Select next reponse
            if ( selectNextResponse ) {
                $('.responseActive').removeClass('responseActive');
                $('.innerTarget').remove();
                $('.responseItem[data-ontarget=false]').first().addClass('responseActive');
                clickActive = true;
                $('.gridOuter').append('<div class="innerTarget gridInner"><table class="bottom" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" width="50%"></td><td class="tr" width="50%"></td></tr><tr><td class="bl"></td><td class="br"></td></tr></table><table class="top" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" height="25%" colspan="2" valign="top" align="center">' + $('.axisLabel.top .labelTxt').text() + '</td></tr><tr><td class="tr" width="50%" height="50%" align="left">' + $('.axisLabel.left .labelTxt').text() + '</td><td width="50%" height="50%" align="right">' + $('.axisLabel.right .labelTxt').text() + '</td></tr><tr><td class="bl"height="25%" colspan="2" valign="bottom" align="center">' + $('.axisLabel.bottom .labelTxt').text() + '</td></tr></table></div>');
                // IF IE7/8
                if (!Modernizr.csstransforms) {
                    $('.innerTarget .bottom').hide();
                }
                if ( !hideLabels ) $('.innerTarget .top td').css('background','#000').css('opacity','.1').text('');

                $('.innerTarget').on('click', function(e) {
                    setTarget(e);
                }).width($('.gridInner').outerWidth()).height($('.gridInner').outerHeight());
                $('.startArea').on('click', function(e) {
                    setTarget(e);
                });
            }
            if (window.askia
                && window.arrLiveRoutingShortcut
                && window.arrLiveRoutingShortcut.length > 0
                && window.arrLiveRoutingShortcut.indexOf(options.currentQuestion) >= 0) {
                askia.triggerAnswer();
            }
        }

        function init() {

            $( ".startArea" ).droppable({
                //activate: function( event, ui ) { dragging = true },
                tolerance: "pointer",
                drop: function( event, ui ) {

                    //dragging = false;

                    // IF IE8
                    if (!Modernizr.csstransforms) {

                        var maxItemScale = scaleOnTarget,

                            topOrigin = $('.gridInner').offset().top,
                            leftOrigin = $('.gridInner').offset().left,
                            nImageWidth = ($('.responseActive img').data('owidth') * scaleOnTarget) + "px",
                            nImageHeight = ($('.responseActive img').data('oheight') * scaleOnTarget) + "px",
                            nImagePaddingT = parseInt($('.responseActive img').css('padding-top')) * scaleOnTarget + "px",
                            nImagePaddingR = parseInt($('.responseActive img').css('padding-right')) * scaleOnTarget + "px",
                            nImagePaddingB = parseInt($('.responseActive img').css('padding-bottom')) * scaleOnTarget + "px",
                            nImagePaddingL = parseInt($('.responseActive img').css('padding-left')) * scaleOnTarget + "px",
                            nTxtPaddingT = parseInt($('.responseActive .responseText').css('padding-top')) * scaleOnTarget + "px",
                            nTxtPaddingR = parseInt($('.responseActive .responseText').css('padding-right')) * scaleOnTarget + "px",
                            nTxtPaddingB = parseInt($('.responseActive .responseText').css('padding-bottom')) * scaleOnTarget + "px",
                            nTxtPaddingL = parseInt($('.responseActive .responseText').css('padding-left')) * scaleOnTarget + "px",
                            nWidth = parseInt($('.responseActive').data('owidth')) * scaleOnTarget,
                            nheight = parseInt($('.responseActive').data('oheight')) * scaleOnTarget,
                            nPaddingT = parseInt($('.responseActive').css('padding-top')) * scaleOnTarget + "px",
                            nPaddingR = parseInt($('.responseActive').css('padding-right')) * scaleOnTarget + "px",
                            nPaddingB = parseInt($('.responseActive').css('padding-bottom')) * scaleOnTarget + "px",
                            nPaddingL = parseInt($('.responseActive').css('padding-left')) * scaleOnTarget + "px";

                        $(ui.draggable).find('img').css({
                            'width':$(ui.draggable).find('img').data('owidth'),
                            'height':$(ui.draggable).find('img').data('oheight'),
                            'padding':''
                        });
                        $(ui.draggable).find('.response_text').css({
                            'font-size':'',
                            'padding':''
                        }).show();
                        $(ui.draggable).css({
                            'width':'',
                            'height':'',
                            'padding':''
                        });

                        $( ui.draggable ).draggable(
                            "option", {
                                cursorAt: {
                                    /*top:(!Modernizr.csstransforms)?($('.responseActive').outerHeight()/2):(parseInt($('.responseActive').data('oheight'))/2),
									left:(!Modernizr.csstransforms)?($('.responseActive').outerWidth()/2):(parseInt($('.responseActive').data('owidth'))/2) */
                                    top:(!Modernizr.csstransforms)?($('.responseActive').outerHeight()/2):($('.responseActive').outerHeight()/2),
                                    left:(!Modernizr.csstransforms)?($('.responseActive').outerWidth()/2):($('.responseActive').outerWidth()/2)
                                },
                                revert:'invalid'
                            }
                        );
                        /**/
                    } else {

                        $( ui.draggable ).draggable(
                            "option", {
                                revert:'invalid'
                            }
                        );
                        $( ui.draggable ).transition({ scale: 1 }, options.animationSpeed)

                    }
                    /**/

                    $( ui.draggable )
                        .animate({ top:$(ui.draggable).data('top'), left:$(ui.draggable).data('left') }, options.animationSpeed)
                        .attr({'data-value':'','data-ontarget':'false'});

                    // Write values
                    items[($(ui.draggable).data('index')*2)].element.val('');
                    items[($(ui.draggable).data('index')*2)+1].element.val('');

                    $('.responseActive').removeClass('responseActive');
                    clickActive = false;
                    $('.innerTarget').remove();

                    if ( stackResponses ) {
                        $('.responseItem[data-ontarget=false]').hide();
                        $('.responseItem[data-ontarget=false]').first().show();
                    }

                    // Select next reponse
                    if ( selectNextResponse ) {
                        $('.responseActive').removeClass('responseActive');
                        $('.responseItem[data-ontarget=false]').first().addClass('responseActive');
                        clickActive = true;
                        $('.gridOuter').append('<div class="innerTarget gridInner"><table class="bottom" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" width="50%"></td><td class="tr" width="50%"></td></tr><tr><td class="bl"></td><td class="br"></td></tr></table><table class="top" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" height="25%" colspan="2" valign="top" align="center">' + $('.axisLabel.top .labelTxt').text() + '</td></tr><tr><td class="tr" width="50%" height="50%" align="left">' + $('.axisLabel.left .labelTxt').text() + '</td><td width="50%" height="50%" align="right">' + $('.axisLabel.right .labelTxt').text() + '</td></tr><tr><td class="bl"height="25%" colspan="2" valign="bottom" align="center">' + $('.axisLabel.bottom .labelTxt').text() + '</td></tr></table></div>');
                        // IF IE7/8
                        if (!Modernizr.csstransforms) {
                            $('.innerTarget .bottom').hide();
                        }
                        if ( !hideLabels ) $('.innerTarget .top td').css('background','#000').css('opacity','.1').text('');

                        $('.innerTarget').on('click', function(e) {
                            setTarget(e);
                        }).width($('.gridInner').outerWidth()).height($('.gridInner').outerHeight());
                        $('.startArea').on('click', function(e) {
                            setTarget(e);
                        });
                    }
                    if (window.askia
                        && window.arrLiveRoutingShortcut
                        && window.arrLiveRoutingShortcut.length > 0
                        && window.arrLiveRoutingShortcut.indexOf(options.currentQuestion) >= 0) {
                        askia.triggerAnswer();
                    }

                }
            }).height( $('.startArea').outerHeight() );

            for ( var i=($('.responseItem').length-1); i>=0; i-- ) {

                var offset = $('.responseItem').eq(i).offset();
                $('.responseItem').eq(i).css("position", "absolute");
                $('.responseItem').eq(i).offset(offset);

            }
            if ( stackResponses ) {

                for ( var i=($('.responseItem').length-1); i>=0; i-- ) {

                    var offset = $('.responseItem').eq(0).offset();
                    $('.responseItem').eq(i).css("position", "absolute");
                    $('.responseItem').eq(i).offset(offset);

                }

                // Find biggest response height
                var maxHeight = Math.max.apply(null, $(".responseItem").map(function () {
                    return $(this).outerHeight(true);
                }).get());
                $('.startArea').height( maxHeight );

                // Make all responses same height
                var elementHeights = $('.responseItem').map(function() {
                    return $(this).height();
                }).get();

                var maxHeight = Math.max.apply(null, elementHeights);

                $('.responseItem').height(maxHeight);

            }

            // Activate items
            $('.responseItem').each(function(index) {
                initZindex--;
                // if value is set then move item;
                var container = $(this).parent('.adc-dragndrop'),
                    xVal = items[$(this).data('index')*2].element.val()/* == '' ? '' : $.inArray( parseInt($('#' + items[$(this).data('index')].id).val()), valuesArray )*/,
                    yVal = items[($(this).data('index')*2)+1].element.val(),/* == ''*/
                    maxItemScale = scaleOnTarget,
                    newItemScale = 0;
                /*f*/
                if ( xVal != '' ) {
                    if ( originLocation === "bottomLeft" ) {
                        yVal = gridSquares - yVal;
                    } else {
                        xVal = parseInt(xVal) + (gridSquares * 0.5);
                        yVal = (gridSquares * 0.5) - parseInt(yVal);
                    }
                }

                /*
				if ( originLocation === 'bottomLeft' ) {
					items[($(ui.draggable).data('index')*2)].element.val(x);
					items[($(ui.draggable).data('index')*2)+1].element.val(gridSquares - y);
				} else {
					items[($(ui.draggable).data('index')*2)].element.val(x - (gridSquares * 0.5));
					items[($(ui.draggable).data('index')*2)+1].element.val((gridSquares * 0.5) - y);
				}
				*/

                $(this).data({
                    'left':$(this).position().left, // REMOVE TOP AND LEFT DATA
                    'top':$(this).position().top,
                    'ofontsize':$(this).find('.response_text').css('font-size'),
                    'owidth':$(this).width(),
                    'oheight':$(this).height(),
                    'opadding':$(this).css('padding'),
                    'oimgpadding':$(this).find('.img').css('padding'),
                    'otextpadding':$(this).find('.response_text').css('padding')
                }).attr({'data-value':'','data-ontarget':'false'});

                // Check if response already has a value
                //if ( parseInt(xVal) >= 0 ) {
                if ( xVal != '' ) {

                    $(this).draggable({
                        revert: 'invalid',
                        zIndex: 2700,
                        cursorAt: {
                            /*top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):(parseInt($(this).data('oheight'))/2),
							left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):(parseInt($(this).data('owidth'))/2) */
                            top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):($(this).outerHeight()/2),
                            left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):($(this).outerWidth()/2)
                        },
                        drag: function(){
                            dragCheck = true;
                        },
                        stop: function(){
                            dragCheck = false;
                        }
                    }).attr('data-ontarget',true)
                    /*.on('mouseup', function (event) {
						//noDrag(event.target);
					})*/;

                    // IF IE8
                    if (!Modernizr.csstransforms) {

                        var maxItemScale = scaleOnTarget,
                            topOrigin = $('.gridInner').offset().top,
                            leftOrigin = $('.gridInner').offset().left,
                            nImageWidth = ($(this).find('img').data('owidth') * scaleOnTarget) + "px",
                            nImageHeight = ($(this).find('img').data('oheight') * scaleOnTarget) + "px",
                            nImagePaddingT = parseInt($(this).find('img').css('padding-top')) * scaleOnTarget + "px",
                            nImagePaddingR = parseInt($(this).find('img').css('padding-right')) * scaleOnTarget + "px",
                            nImagePaddingB = parseInt($(this).find('img').css('padding-bottom')) * scaleOnTarget + "px",
                            nImagePaddingL = parseInt($(this).find('img').css('padding-left')) * scaleOnTarget + "px",
                            nTxtPaddingT = parseInt($(this).find('.responseText').css('padding-top')) * scaleOnTarget + "px",
                            nTxtPaddingR = parseInt($(this).find('.responseText').css('padding-right')) * scaleOnTarget + "px",
                            nTxtPaddingB = parseInt($(this).find('.responseText').css('padding-bottom')) * scaleOnTarget + "px",
                            nTxtPaddingL = parseInt($(this).find('.responseText').css('padding-left')) * scaleOnTarget + "px",
                            nWidth = parseInt($(this).data('owidth')) * scaleOnTarget,
                            nheight = parseInt($(this).data('oheight')) * scaleOnTarget,
                            nPaddingT = parseInt($(this).css('padding-top')) * scaleOnTarget + "px",
                            nPaddingR = parseInt($(this).css('padding-right')) * scaleOnTarget + "px",
                            nPaddingB = parseInt($(this).css('padding-bottom')) * scaleOnTarget + "px",
                            nPaddingL = parseInt($(this).css('padding-left')) * scaleOnTarget + "px",
                            x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) - (nWidth*0.5),
                            y = topOrigin + ((yVal/gridSquares) * $('.gridInner').outerHeight()) - (nheight*0.5);

                        $(this).offset({top:(y),left:(x)});

                        $(this).find('.response_text').css({'font-size':responseFontSize});
                        $(this).find('img').css({
                            'width':nImageWidth,
                            'height':nImageHeight,
                            'padding':nImagePaddingT + " " + nImagePaddingR + " " + nImagePaddingB + " " + nImagePaddingL
                        });
                        $(this).find('.response_text').css({
                            'font-size':responseFontSize + responseFontUnits,
                            'padding':nTxtPaddingT + " " + nTxtPaddingR + " " + nTxtPaddingB + " " + nTxtPaddingL
                        }).hide();
                        $(this).css({
                            'width':nWidth,
                            'height':nheight,
                            'padding':nPaddingT + " " + nPaddingR + " " + nPaddingB + " " + nPaddingL

                        });

                        $(this).draggable(
                            "option", {
                                cursorAt: {
                                    /*top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):(parseInt($(this).data('oheight'))/2),
									left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):(parseInt($(this).data('owidth'))/2) /*/
                                    top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):($(this).outerHeight()/2),
                                    left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):($(this).outerWidth()/2)
                                },
                                revert:'invalid'
                            }
                        );

                        $(this).data({'revertX':$(ui.draggable).position().left,'revertY':$(ui.draggable).position().top});

                        $(this).transition({ scale:maxItemScale }, 0,function() {

                        });

                    } else {

                        var maxItemScale = scaleOnTarget,
                            topOrigin = $('.gridInner').offset().top,
                            leftOrigin = $('.gridInner').offset().left,
                            x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) - ($(this).outerWidth()*0.5),
                            y = topOrigin + ((yVal/gridSquares) * $('.gridInner').outerHeight()) - ($(this).outerHeight()*0.5);

                        $(this).offset({top:y,left:x});
                        $(this).transition({ scale:maxItemScale }, options.animationSpeed,function() {

                        });

                    }

                } else {
                    // Initialise draggables
                    $(this).draggable({
                        revert: 'invalid',
                        zIndex: 2700,
                        cursorAt: {
                            //top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):(parseInt($(this).data('oheight'))/2),
                            //left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):(parseInt($(this).data('owidth'))/2)
                            top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):($(this).outerHeight()/2),
                            left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):($(this).outerWidth()/2)
                        },
                        drag: function(){
                            dragCheck = true;
                        },
                        stop: function(event, ui){
                            dragCheck = false;
                        },
                        start: function () {

                        }
                    }).on('click', function(e) {
                        e.stopPropagation();
                        if ( !clickActive ) {
                            $('.responseActive').removeClass('responseActive');
                            $('.innerTarget').remove();
                            $(this).addClass('responseActive');
                            clickActive = true;
                            //$('.gridOuter').append('<div class="innerTarget gridInner"></div>');
                            $('.gridOuter').append('<div class="innerTarget gridInner"><table class="bottom" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" width="50%"></td><td class="tr" width="50%"></td></tr><tr><td class="bl"></td><td class="br"></td></tr></table><table class="top" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" height="25%" colspan="2" valign="top" align="center">' + $('.axisLabel.top .labelTxt').text() + '</td></tr><tr><td class="tr" width="50%" height="50%" align="left">' + $('.axisLabel.left .labelTxt').text() + '</td><td width="50%" height="50%" align="right">' + $('.axisLabel.right .labelTxt').text() + '</td></tr><tr><td class="bl"height="25%" colspan="2" valign="bottom" align="center">' + $('.axisLabel.bottom .labelTxt').text() + '</td></tr></table></div>');
                            // IF IE7/8
                            if (!Modernizr.csstransforms) {
                                $('.innerTarget .bottom').hide();
                            }
                            if ( !hideLabels ) $('.innerTarget .top td').css('background','#000').css('opacity','.1').text('');

                            $('.innerTarget').on('click', function(e) {
                                setTarget(e);
                            }).width($('.gridInner').outerWidth()).height($('.gridInner').outerHeight());
                            $('.startArea').on('click', function(e) {
                                setTarget(e);
                            });
                        } else {
                            $('.responseActive').removeClass('responseActive');
                            clickActive = false;
                            $('.innerTarget').remove();
                            $('.startArea').off('click');
                        }
                    });
                }

                $(this).css('z-index',initZindex);

            });

            if ( stackResponses ) {
                $('.responseItem').hide();
                $('.responseItem[data-ontarget=true]').show();
                $('.responseItem[data-ontarget=false]').first().show();
            }

            // Select next reponse
            if ( selectNextResponse ) {
                $('.responseActive').removeClass('responseActive');
                $('.innerTarget').remove();
                $('.responseItem[data-ontarget=false]').first().addClass('responseActive');
                clickActive = true;
                $('.gridOuter').append('<div class="innerTarget gridInner"><table class="bottom" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" width="50%"></td><td class="tr" width="50%"></td></tr><tr><td class="bl"></td><td class="br"></td></tr></table><table class="top" cellpadding="0" cellspacing="0" border="0" width="' + $('.gridInner').outerWidth() + '" height="' + $('.gridInner').outerHeight() + '"><tr><td class="tl" height="25%" colspan="2" valign="top" align="center">' + $('.axisLabel.top .labelTxt').text() + '</td></tr><tr><td class="tr" width="50%" height="50%" align="left">' + $('.axisLabel.left .labelTxt').text() + '</td><td width="50%" height="50%" align="right">' + $('.axisLabel.right .labelTxt').text() + '</td></tr><tr><td class="bl"height="25%" colspan="2" valign="bottom" align="center">' + $('.axisLabel.bottom .labelTxt').text() + '</td></tr></table></div>');
                // IF IE7/8
                if (!Modernizr.csstransforms) {
                    $('.innerTarget .bottom').hide();
                }
                if ( !hideLabels ) $('.innerTarget .top td').css('background','#000').css('opacity','.1').text('');

                $('.innerTarget').on('click', function(e) {
                    setTarget(e);
                }).width($('.gridInner').outerWidth()).height($('.gridInner').outerHeight());
                $('.startArea').on('click', function(e) {
                    setTarget(e);
                });
            }

        }

        // Attach all events
        //$container.delegate('.responseItem', 'click', (!isMultiple) ? selectStatementSingle : selectStatementMulitple);
        if ( total_images > 0 ) {
            $container.find('img').each(function() {
                var fakeSrc = $(this).attr('src');
                $("<img/>").css('display', 'none').on('load', function() {
                    images_loaded++;
                    if (images_loaded >= total_images) {
                        // now all images are loaded.

                        // Check for missing images and resize
                        $container.find('.responseItem img').each(function forEachImage(index) {

                            $(this).show();

                            var size = {
                                width: $(this).width(),
                                height: $(this).height()
                            };

                            if (options.forceImageSize === "height" ) {
                                if ( size.height > parseInt(options.maxImageHeight,10) ) {
                                    var ratio = ( parseInt(options.maxImageHeight,10) / size.height);
                                    size.height *= ratio,
                                        size.width  *= ratio;
                                }
                            } else if (options.forceImageSize === "width" ) {
                                if ( size.width > parseInt(options.maxImageWidth,10) ) {
                                    var ratio = ( parseInt(options.maxImageWidth,10) / size.width);
                                    size.width  *= ratio,
                                        size.height *= ratio;
                                }

                            } else if (options.forceImageSize === "both" ) {
                                if ( parseInt(options.maxImageHeight,10) > 0 && size.height > parseInt(options.maxImageHeight,10) ) {
                                    var ratio = ( parseInt(options.maxImageHeight,10) / size.height);
                                    size.height *= ratio,
                                        size.width  *= ratio;
                                }

                                if ( parseInt(options.maxImageWidth,10) > 0 && size.width > parseInt(options.maxImageWidth,10) ) {
                                    var ratio = ( parseInt(options.maxImageWidth,10) / size.width);
                                    size.width  *= ratio,
                                        size.height *= ratio;
                                }

                            }

                            $(this).css(size);
                            $container.find('.dropZone').each(function() {
                                $(this).find('.responseItemMini img').eq(index).css(size);
                            });

                            if ( autoImageSize ) {

                                var rHeight = $(this).parent('.responseItem').height() - $(this).parent('.responseItem').find('.reponse_text').outerHeight(),
                                    rWidth = $(this).parent('.responseItem').width(),
                                    iHeight = $(this).outerHeight(),
                                    iWidth = $(this).outerWidth(),
                                    diffX = iHeight - rHeight,
                                    diffY = iWidth - rWidth,
                                    size = {
                                        width: $(this).width(),
                                        height: $(this).height()
                                    };

                                if ( diffX > 0 && diffX > diffY ) {

                                    var ratio = ( iWidth / rWidth );
                                    size.width  *= ratio,
                                        size.height *= ratio;

                                } else if ( diffY > 0 && diffY > diffX ) {

                                    var ratio = ( iHeight / rHeight );
                                    size.height *= ratio,
                                        size.width  *= ratio;

                                }

                                $(this).css(size);
                                $('.responseItemMini img').eq(index).css(size);


                            }

                            $(this).data({'owidth':size.width,'oheight':size.height});
                        });

                        $container.css('visibility','visible');
                        init();

                    }
                }).attr("src", fakeSrc);
            });
        } else {
            $container.css('visibility','visible');
            init();
        }

        // Returns the container
        return this;
    };

} (jQuery));
