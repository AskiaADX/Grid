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
			responseFontUnits = options.responseFontSize.split(responseFontSize)[1];
					
		// check for mobile or reduced screen size
		if( (/iPhone|iPod|iPad|Android|BlackBerry/).test(navigator.userAgent) || $(window).width() <= 400 ) {
			// resize start area to max space
			//resize grid to max space
			stackResponses = true;
			$(this).css({'width':'100%'});
			if ( hideLabelsMobile || hideLabels ) $('.axisLabel').hide();
			$('.gridOuter').width( $(this).width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20)
						   .height( $(this).width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20);
			$('.gridInner').width( $('.gridOuter').height() - 40)
						   .height( $('.gridOuter').width() - 40);
			$('.axisLabel.top, .axisLabel.bottom').width( $('.gridOuter').width() );
			$('.axisLabel.left, .axisLabel.right').height( $('.gridOuter').height() );
			$('.gridOuter').css('marginBottom', $('.axisLabel.top').height() + $('.axisLabel.bottom').height() + 40 + 'px');
			$('.startArea').width('100%').css({'marginBottom':'20px','text-align':'center'});
			$('.responseItem').css({'marginLeft':'auto','marginRight':'auto','float':'none'});
			scaleOnTarget = 0.2;

		}
		if ( hideLabels ) {
			$('.axisLabel').hide();
			$('.gridOuter').width( dropAreaContainerWidthHeight )
						   .height( dropAreaContainerWidthHeight );
		} else {
			$('.gridOuter').width( dropAreaContainerWidthHeight )
						   .height( dropAreaContainerWidthHeight );
			$('.gridOuter').width( $('.gridOuter').width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20)
						   .height( $('.gridOuter').width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20);			   
		}
		$('.gridInner').width( $('.gridOuter').height() - 40)
					   .height( $('.gridOuter').width() - 40);
		$('.crosshair').width($('.gridOuter').width()).height($('.gridOuter').height());
					   
		cellSize = Math.floor( $('.gridInner').width() / gridSquares );
		
		$('.gridCell').each(function(i,e) {
			cellBorderWidth = ($(this).outerWidth() - $(this).width()) / 2,
			cellSize = ($('.gridInner').width() / gridSquares ) - (cellBorderWidth),
			x = col * cellSize,
			y = row * cellSize;
			
			$(this).width( cellSize ).height( cellSize ).css({'top':(y + (row*cellBorderWidth))+'px','left':(x + (col*cellBorderWidth))+'px'});
			col++;
			if ( col == gridSquares ) {
				col = 0;
				row++;
			}
		});
		
		// Position Labels 
		
		$('.axisLabel.top').css('top', (0 - $('.axisLabel.top').outerHeight() - 10) + 'px');
		$('.gridOuter').css('top',($('.axisLabel.top').outerHeight() + 10) + 'px');
		$('.axisLabel.bottom').css('bottom', (0 - $('.axisLabel.top').outerHeight() - 10) + 'px');
		$('.axisLabel.top, .axisLabel.bottom').width( $('.gridOuter').width() );
		
		$('.axisLabel.right').css('right', (0 - $('.axisLabel.right').outerWidth() - 10) + 'px');
		$('.gridOuter').css('right',($('.axisLabel.right').outerWidth() + 10) + 'px');
		$('.axisLabel.left').css('left', (0 - $('.axisLabel.left').outerWidth() - 10) + 'px');
		
		$('.axisLabel.right .labelTxt').css('top', (($('.gridOuter').height()*0.5) - ($('.axisLabel.right .labelTxt').outerHeight()*0.5)) + 'px');
		$('.axisLabel.left .labelTxt').css('top', (($('.gridOuter').height()*0.5) - ($('.axisLabel.left .labelTxt').outerHeight()*0.5)) + 'px');
		
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
		
		// check for mobile or reduced screen size
		/*if( $(this).height() > $(window).height() ) {
			// resize start area to max space
			//resize grid to max space
			stackResponses = true;
			$(this).css({'width':'100%'});
			$('.gridOuter').width( $(this).width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20)
						   .height( $(this).width() - $(this).find('.axisLabel.left').width() - $(this).find('.axisLabel.right').width() - 20);
			$('.gridInner').width( $('.gridOuter').height() - 40)
						   .height( $('.gridOuter').width() - 40);
			$('.axisLabel.top, .axisLabel.bottom').width( $('.gridOuter').width() );
			$('.axisLabel.left, .axisLabel.right').height( $('.gridOuter').height() );
			$('.gridOuter').css('marginBottom', $('.axisLabel.top').height() + $('.axisLabel.bottom').height() + 40 + 'px');
			$('.startArea').width('100%').css({'marginBottom':'20px','text-align':'center'});
			$('.responseItem').css({'marginLeft':'auto','marginRight':'auto','float':'none'});
			scaleOnTarget = 0.2;

		}*/
		
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
			$('.xCounter .counterTxt').html($x);
			$('.yCounter').css({ top: ($newPosY-1)+'px' });
			$('.yCounter .counterTxt').html($y);
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
				y =  gridSquares - Math.round( ( y/$( ".gridInner" ).height() ) * gridSquares );
					
				// Write values				
				items[($(ui.draggable).data('index')*2)].element.val(x);
				items[($(ui.draggable).data('index')*2)+1].element.val(y);
				
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
						nWidth = Math.round(parseInt($(ui.draggable).data('oWidth')) * scaleOnTarget),
						nheight = Math.round(parseInt($(ui.draggable).data('oHeight')) * scaleOnTarget),
						nPaddingT = Math.round(parseInt($(ui.draggable).css('padding-top')) * scaleOnTarget) + "px",
						nPaddingR = Math.round(parseInt($(ui.draggable).css('padding-right')) * scaleOnTarget) + "px",
						nPaddingB = Math.round(parseInt($(ui.draggable).css('padding-bottom')) * scaleOnTarget) + "px",
						nPaddingL = Math.round(parseInt($(ui.draggable).css('padding-left')) * scaleOnTarget) + "px",
						nY = ($(ui.draggable).offset().top + (parseInt($(ui.draggable).data('oHeight'))*0.5)) - (nheight*0.5),
						nX = ($(ui.draggable).offset().left + (parseInt($(ui.draggable).data('oWidth'))*0.5)) - (nWidth*0.5);
					
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
						cursorAt: { 
							top:(!Modernizr.csstransforms)?($(ui.draggable).outerHeight()/2):(parseInt($(ui.draggable).data('oHeight'))/2), 
							left:(!Modernizr.csstransforms)?($(ui.draggable).outerWidth()/2):(parseInt($(ui.draggable).data('oWidth'))/2)
						},
						zIndex: 9999,
						drag: function(){
							dragCheck = true;
						},
						stop: function(){
							dragCheck = false;
							//$(ui.draggable).off('click');
						} 
					}
				);

				$( ui.draggable ).attr('data-value',$(this).data('index'));
									
				$('.xCounter, .yCounter').transition({ opacity: 0 });
				$('html').off("mousemove");
				
			},
			over: function( event, ui ) {
				
				$('.xCounter, .yCounter').transition({ opacity: 1 });
				
				$('html').on("mousemove", function(e){
					mouseFollow(e);
				}).bind(mouseFollow(event));
				
			},
			out: function( event, ui ) {
				
				$('.xCounter, .yCounter').transition({ opacity: 0 });
				$('html').off("mousemove");
				
			}
			
		});
		
		function setTarget(e/*e, target*/) {
			
			$('.responseActive').attr('data-value','ontarget');
			$('.responseActive').transition({ scale:1 },0);
			
			var startXPos = $('.gridInner').offset().left,
				endXPos   = $('.gridInner').outerWidth(),
				xLength   = endXPos,
				startYPos = $('.gridInner').offset().top,
				endYPos   = $('.gridInner').outerHeight(),
				yLength   = endYPos,
				//adjustmentX = (xLength - $('.xCounter').width()) / xLength,
				//adjustmentY = (yLength - $('.yCounter').height()) / yLength,
				$offSetLeft = $('.gridInner').offset().left,
				$offSetTop =  $('.gridInner').offset().top;
				//$newPosX = (e.pageX - $offSetLeft) * adjustmentX,
				//$newPosY = (e.pageY - $offSetTop) * adjustmentY;
			
			//Counter numbers
			var xVal =  Math.round( ( (e.pageX - $offSetLeft)/xLength ) * gridSquares ),
				yVal =  gridSquares - Math.round( ( (e.pageY - $offSetTop)/yLength ) * gridSquares );
			
			// Write values				
			items[($('.responseActive').data('index')*2)].element.val(xVal);
			items[($('.responseActive').data('index')*2)+1].element.val(yVal);
				
				//$x = $x - (gridSquares * 0.5);
				//$y = (gridSquares * 0.5) - $y;
				
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
					nWidth = Math.round(parseInt($('.responseActive').data('oWidth')) * scaleOnTarget),
					nheight = Math.round(parseInt($('.responseActive').data('oHeight')) * scaleOnTarget),
					nPaddingT = Math.round(parseInt($('.responseActive').css('padding-top')) * scaleOnTarget) + "px",
					nPaddingR = Math.round(parseInt($('.responseActive').css('padding-right')) * scaleOnTarget) + "px",
					nPaddingB = Math.round(parseInt($('.responseActive').css('padding-bottom')) * scaleOnTarget) + "px",
					nPaddingL = Math.round(parseInt($('.responseActive').css('padding-left')) * scaleOnTarget) + "px",
					x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) - (nWidth*0.5),
					y = (topOrigin + $('.gridInner').height()) - ((yVal/gridSquares) * $('.gridInner').outerHeight()) - (nheight*0.5);
					
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
					}).hide();
					$('.responseActive').css({
						'width':nWidth,
						'height':nheight,
						'padding':nPaddingT + " " + nPaddingR + " " + nPaddingB + " " + nPaddingL
					});
				}
				
				$('.responseActive').draggable( 
						"option", {
							cursorAt: { 
								top:(!Modernizr.csstransforms)?($('.responseActive').outerHeight()/2):(parseInt($('.responseActive').data('oHeight'))/2), 
								left:(!Modernizr.csstransforms)?($('.responseActive').outerWidth()/2):(parseInt($('.responseActive').data('oWidth'))/2) 
							}
						}
					);

				$('.responseActive').removeClass('responseActive');
				clickActive = false;
				
				
					
			} else {
				
				var maxItemScale = scaleOnTarget,
					topOrigin = $('.gridInner').offset().top,
					leftOrigin = $('.gridInner').offset().left,
					x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) /*- ($('.responseActive').outerWidth()*0.5)*/,
					y = (topOrigin + $('.gridInner').outerHeight()) - (((yVal)/gridSquares) * $('.gridInner').outerHeight()) /*- ($('.responseActive').outerHeight()*0.5)*/;
					
				//$('.responseActive').offset({top:topOrigin,left:leftOrigin - x});	
				$('.responseActive').offset({top:(y - $('.responseActive').data('oHeight')*0.5),left:(x - $('.responseActive').data('oWidth')*0.5)});	
				$('.responseActive').transition({ scale:maxItemScale }, 0,function() {
					$('.responseActive').removeClass('responseActive');
					clickActive = false;
				});
				
			}

			// Select next reponse
			if ( selectNextResponse ) {
				if ( $(".responseItem[data-value='']").length > 0 ) {
					$(".responseItem[data-value='']").eq(0).addClass('responseActive');
					clickActive = true;
					$('.gridOuter').prepend('<div class="innerTarget gridInner"></div>');
					$('.gridOuter .innerTarget').click( function(e) {
						$('.innerTarget').remove();
						setTarget(e);
					});
				}
			}
			
			
					
			/*if ( !removingItem ) {
				if ( target === 'start' ) {
					
					if ( $(clickActive).data('index') != null ) {
						$(clickActive).data({'onTarget':false}).attr({'data-value':''});
						$(clickActive).transition({ scale: 1, top:$(clickActive).data('top'), left:$(clickActive).data('left') }, options.animationSpeed);
						$('#' + iterations[$(clickActive).data('index')].id).val('');
					}
					
				} else {
					
					// check for exclusivity if there are exclusive areas
					// check if this is an exclusive droparea
					var areaExclusive = false,
						containerID = $( "#drop"+target ).data('index');
					
					if ( exclusiveAreas ) {
						for ( var i=0; i<exclusiveArray.length; i++ ) {
							if ( (parseInt(exclusiveArray[i]) >= 0 && (parseInt(exclusiveArray[i]) - 1) === containerID) || 
								 ( parseInt(exclusiveArray[i]) < 0 && (parseInt(exclusiveArray[i]) + numberOfDropZones) === containerID) ) areaExclusive = true;
						}
					}
					
					// check if it already contains an item
					if ( !(areaExclusive && $(".responseItem[data-value='" + containerID + "']").size() > 0) ) {
						
						if ( $(clickActive).data('onTarget') ) { // if already on target
							
							var val = target,
								maxItemScale = options.scaleOnTarget,
								x = $( "#drop"+val ).position().left - $(clickActive).outerWidth(true)*0.5 + ($( "#drop"+val ).outerWidth()*0.5),
								y = $( "#drop"+val ).position().top - $(clickActive).outerHeight(true)*0.5 + ($( "#drop"+val ).outerHeight()*0.5);
										
							$(clickActive).data({'onTarget':true}).attr({'data-value':val});
							$(clickActive).transition({top:y, left:x }, options.animationSpeed,function() {
								sortItems(parseInt(val));
							})
								
							$('#' + iterations[$(clickActive).data('index')].id).attr('value',$( "#drop"+target ).attr('data-value'));
							
						} else if ($(clickActive).data('index') != null) {
							
							$('#' + iterations[$(clickActive).data('index')].id).attr('value',$( "#drop"+target ).attr('data-value'));
							
							// IF IE7/8
							if (!Modernizr.csstransforms) {
								
								var val = target;
								
								$(clickActive).attr({'data-value':val}).hide();
								$('#drop'+target).find('.resMini'+$(clickActive).data('index')).show();
								clickActive = '';
								
							} else {
								
								var val = target,
									maxItemScale = options.scaleOnTarget,
									x = $( "#drop"+val ).position().left - $(clickActive).outerWidth(true)*0.5 + ($( "#drop"+val ).outerWidth()*0.5),
									y = $( "#drop"+val ).position().top - $(clickActive).outerHeight(true)*0.5 + ($( "#drop"+val ).outerHeight()*0.5);
											
								$(clickActive).data({'onTarget':true}).attr({'data-value':val});
								$(clickActive).transition({ top:y, left:x }, options.animationSpeed,function() {
									sortItems(parseInt(val));
								})
								
							}
							
						}
						
						// Remove active status from item
						$(clickActive).removeClass('responseActive');
						clickActive = null;
						$('.dropZone, .startArea').unbind();
						
						// Select next reponse
						if ( selectNextResponse ) {
							noDrag($(".responseItem[data-value='']").eq(0));	
						}
						
					}
					
				}
			}*/
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
							nWidth = parseInt($('.responseActive').data('oWidth')) * scaleOnTarget,
							nheight = parseInt($('.responseActive').data('oHeight')) * scaleOnTarget,
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
									top:(!Modernizr.csstransforms)?($('.responseActive').outerHeight()/2):(parseInt($('.responseActive').data('oHeight'))/2), 
									left:(!Modernizr.csstransforms)?($('.responseActive').outerWidth()/2):(parseInt($('.responseActive').data('oWidth'))/2) 
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
						.attr('data-value','');
	
					// Write values				
					items[($(ui.draggable).data('index')*2)].element.val('');
					items[($(ui.draggable).data('index')*2)+1].element.val('');
						
				}
			}).height( $('.startArea').outerHeight() );
				
			for ( var i=($('.responseItem').size()-1); i>=0; i-- ) {
			
				var offset = $('.responseItem').eq(i).offset();
					$('.responseItem').eq(i).css("position", "absolute");
					$('.responseItem').eq(i).offset(offset);
					
			}
			if ( stackResponses ) {
				
				for ( var i=($('.responseItem').size()-1); i>=0; i-- ) {
			
					var offset = $('.responseItem').eq(0).offset();
						$('.responseItem').eq(i).css("position", "absolute");
						$('.responseItem').eq(i).offset(offset);
						
				}
				
				// Find biggest response height
				var maxHeight = Math.max.apply(null, $(".responseItem").map(function () {
					return $(this).outerHeight(true);
				}).get());
				$('.startArea').height( maxHeight );
				
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
				
				$(this).data({
					'left':$(this).position().left, // REMOVE TOP AND LEFT DATA
					'top':$(this).position().top,
					'onTarget':false,
					'oFontSize':$(this).find('.response_text').css('font-size'),
					'oWidth':$(this).outerWidth(),
					'oHeight':$(this).outerHeight()
				}).attr('data-value','');
									
				// Check if response already has a value
				if ( parseInt(xVal) >= 0 ) {
					
					$(this).draggable({ 
						revert: 'invalid', 
						zIndex: 2700, 
						cursorAt: { 
							top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):(parseInt($(this).data('oHeight'))/2), 
							left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):(parseInt($(this).data('oWidth'))/2) 
						},
						drag: function(){
							dragCheck = true;
						},
						stop: function(){
							dragCheck = false;
						} 
					})/*.bind('mouseup', function (event) {
						//noDrag(event.target);	
					})*/;
									
					// IF IE7/8
					/*if (!Modernizr.csstransforms) {
						
						$(this).attr({'data-value':val}).hide();
						$('#drop'+val).find('.resMini'+$(this).data('index')).show();
						
					} else {*/
					
						/*
						var x = event.pageX - $('.gridInner').offset().left,
							y = event.pageY - $('.gridInner').offset().top;
						
						// Calculate values
						x =  Math.round( ( x/$( ".gridInner" ).width() ) * gridSquares );
						y =  Math.round( ( y/$( ".gridInner" ).height() ) * gridSquares );
						
						*/
						
						/*var startXPos = $('.gridInner').offset().left,
							endXPos   = $('.gridInner').outerWidth(),
							xLength   = endXPos,
							startYPos = $('.gridInner').offset().top,
							endYPos   = $('.gridInner').outerHeight(),
							yLength   = endYPos,
							adjustmentX = (xLength - $('.xCounter').width()) / xLength,
							adjustmentY = (yLength - $('.yCounter').height()) / yLength,
							$offSetLeft = $('.gridInner').offset().left,
							$offSetTop =  $('.gridInner').offset().top,
							$newPosX = (e.pageX - $offSetLeft) * adjustmentX,
							$newPosY = (e.pageY - $offSetTop) * adjustmentY;
						
						//Counter numbers
						var $x =  Math.round( ( (e.pageX - $offSetLeft)/xLength ) * gridSquares ),
							$y =  Math.round( ( (e.pageY - $offSetTop)/yLength ) * gridSquares );*/
							
						
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
								nWidth = parseInt($(this).data('oWidth')) * scaleOnTarget,
								nheight = parseInt($(this).data('oHeight')) * scaleOnTarget,
								nPaddingT = parseInt($(this).css('padding-top')) * scaleOnTarget + "px",
								nPaddingR = parseInt($(this).css('padding-right')) * scaleOnTarget + "px",
								nPaddingB = parseInt($(this).css('padding-bottom')) * scaleOnTarget + "px",
								nPaddingL = parseInt($(this).css('padding-left')) * scaleOnTarget + "px",
								x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) - (nWidth*0.5),
								y = (topOrigin + $('.gridInner').height()) - ((yVal/gridSquares) * $('.gridInner').outerHeight()) - (nheight*0.5);
								
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
										top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):(parseInt($(this).data('oHeight'))/2), 
										left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):(parseInt($(this).data('oWidth'))/2) 
									},
									revert:'invalid'
								}
							);
							
							$(this).transition({ scale:maxItemScale }, 0,function() {

							});
								
						} else {
							
							var maxItemScale = scaleOnTarget,
							topOrigin = $('.gridInner').offset().top,
							leftOrigin = $('.gridInner').offset().left,
							x = leftOrigin + ((xVal/gridSquares) * $('.gridInner').outerWidth()) - ($(this).outerWidth()*0.5),
							y = (topOrigin + $('.gridInner').height()) - ((yVal/gridSquares) * $('.gridInner').outerHeight()) - ($(this).outerHeight()*0.5);
	
							$(this).offset({top:y,left:x});	
							$(this).transition({ scale:maxItemScale }, options.animationSpeed,function() {
		
							});
							
						}
							
							
						
						
						
					/*}*/
													
				} else {
					// Initialise draggables
					$(this).draggable({ 
						revert: 'invalid', 
						zIndex: 2700, 
						cursorAt: { 
							top:(!Modernizr.csstransforms)?($(this).outerHeight()/2):(parseInt($(this).data('oHeight'))/2), 
							left:(!Modernizr.csstransforms)?($(this).outerWidth()/2):(parseInt($(this).data('oWidth'))/2) 
						},
						drag: function(){
							dragCheck = true;
						},
						stop: function(event, ui){
							dragCheck = false;
							//$( event.toElement ).on('click', function(e){ e.stopImmediatePropagation(); } );
						},
						start: function () {

						}
					}).click( function() {
						if ( !clickActive ) {
							$(this).addClass('responseActive');
							clickActive = true;
							$('.gridOuter').prepend('<div class="innerTarget gridInner"></div>');
							$('.gridOuter .innerTarget').click( function(e) {
								$('.innerTarget').remove();
								setTarget(e);
							});
						}
					});
				}
				
				//$(this).css('z-index',initZindex);
				
			});
			
			// Select next reponse /**/
			if ( selectNextResponse ) {
				if ( $(".responseItem[data-value='']").length > 0 ) {
					$(".responseItem[data-value='']").eq(0).addClass('responseActive');
					clickActive = true;
					clickActive = true;
					$('.gridOuter').prepend('<div class="innerTarget gridInner"></div>');
					$('.gridOuter .innerTarget').click( function(e) {
						$('.innerTarget').remove();
						setTarget(e);
					});
				}
			}
			
		}
		
		// Attach all events
		//$container.delegate('.responseItem', 'click', (!isMultiple) ? selectStatementSingle : selectStatementMulitple);
		if ( total_images > 0 ) {
			$container.find('img').each(function() {
				var fakeSrc = $(this).attr('src');
				$("<img/>").css('display', 'none').load(function() {
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