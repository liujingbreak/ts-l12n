// Fit a string to a fixed container size, by shrinking the font-size until it fits exactly
publicProfile.directive('fittext', ['$timeout', function($timeout) {
  'use strict';

  return {
    scope: {
      minFontSize: '@',
      maxFontSize: '@',
      text: '='
    },
    restrict: 'C',
    transclude: true,
    template: "<div ng-transclude class='textContainer t' ng-bind=\"text\">JUST \nFOR TEST 1 </div>" +
    	"more string  "
    	+ ' <span class="t">JUST FOR ' 
    	+ 'TEST 2</span> '
    	+ nothing + ' <span class="t">JUST FOR TEST 3</span> ',
    	
    controller: function($scope, $element, $attrs) {
      var maxFontSize = $scope.maxFontSize || 50;
      var minFontSize = $scope.minFontSize || 8;

      // text container
      var textContainer = $element[0].querySelector('.textContainer');

      // max dimensions for text container
      var maxHeight = $element[0].offsetHeight;
      var maxWidth = $element[0].offsetWidth;

      var textContainerHeight;
      var textContainerWidth;
      var fontSize = maxFontSize;

      var resizeText = function(){
        $timeout(function(){
          // set new font size and determine resulting dimensions
          textContainer.style.fontSize = fontSize + 'px';
          textContainerHeight = textContainer.offsetHeight;
          textContainerWidth = textContainer.offsetWidth;

          if((textContainerHeight > maxHeight || textContainerWidth > maxWidth) && fontSize > minFontSize){

            // shrink font size
            var ratioHeight = Math.floor(textContainerHeight / maxHeight);
            var ratioWidth = Math.floor(textContainerWidth / maxWidth);
            var shrinkFactor = ratioHeight > ratioWidth ? ratioHeight : ratioWidth;
            fontSize -= shrinkFactor;
            // console.log("fontSize", fontSize);
            resizeText();
          }else{
            textContainer.style.visibility = "visible";
          }
        }, 0);
      };

      // watch for changes to text
      $scope.$watch('text', function(newText, oldText){
        if(newText === undefined) return;

        // text was deleted
        if(oldText !== undefined && newText.length < oldText.length){
          fontSize = maxFontSize;
          // console.log("Letter was deleted");
        }
        textContainer.style.visibility = "hidden";
        resizeText();
      });
    }
  };
}]);