/* standard_default.js */
$(window).load(function() {
	$('#adc_{%= CurrentADC.InstanceId %}').adcGrid({
		
		maxWidth : '{%= CurrentADC.PropValue("maxWidth") %}',
		controlWidth : '{%= CurrentADC.PropValue("controlWidth") %}',
		maxImageWidth : '{%= CurrentADC.PropValue("maxImageWidth") %}',
		maxImageHeight : '{%= CurrentADC.PropValue("maxImageHeight") %}',
		forceImageSize : '{%= CurrentADC.PropValue("forceImageSize") %}',
		animationSpeed : '{%= CurrentADC.PropValue("animationSpeed") %}',
		showResponseHoverColour: {%= (CurrentADC.PropValue("showResponseHoverColour") = "1") %},
		showResponseHoverFontColour: {%= (CurrentADC.PropValue("showResponseHoverFontColour") = "1") %},
		showResponseHoverBorder: {%= (CurrentADC.PropValue("showResponseHoverBorder") = "1") %},
		controlAlign : '{%= CurrentADC.PropValue("controlAlign") %}',
		autoImageSize: {%= (CurrentADC.PropValue("autoImageSize") = "1") %},
		stackResponses: {%= (CurrentADC.PropValue("stackResponses") = "1") %},
		selectNextResponse: {%= (CurrentADC.PropValue("selectNextResponse") = "1") %},
		autoStackWidth : '{%= CurrentADC.PropValue("autoStackWidth") %}',
		scaleOnTarget : {%= CurrentADC.PropValue("scaleOnTarget") %},
		gridSquares : {%= CurrentADC.PropValue("gridSquares") %},
		dropAreaContainerWidthHeight : '{%= CurrentADC.PropValue("dropAreaContainerWidthHeight") %}',
		hideLabels : {%= (CurrentADC.PropValue("hideLabels") = "1") %},
		hideLabelsMobile : {%= (CurrentADC.PropValue("hideLabelsMobile") = "1") %},
		items : [
			{%:= CurrentADC.GetContent("dynamic/standard_numeric.js").ToText()%}
		]
	});
});