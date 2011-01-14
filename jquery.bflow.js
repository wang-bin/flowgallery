/*!
 * jQuery bFlow plugin: Simple Cover Flow Plugin
 * Examples and documentation at: http://github.com/bozz/jquery-bflow
 * version 0.5.0 (13-JAN-2011)
 * Author: Boris Searles (boris@lucidgardens.com)
 * Requires jQuery v1.3.2 or later
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */

(function($) { 

/* plugin point of entry */
$.fn.bflow = function(options) {
  _options = $.extend($.fn.bflow.defaults, options);
  return this.each(function(index){
    _initList(this);
  });
};


// expose options
$.fn.bflow.defaults = {
  activeIndex: 0, // index of image that is initially active
  animate: true,
  forceWidth: false,
  forceHeight: false,
  backgroundColor: 'black',
  thumbWidth: 100,  // required, currently cannot be 'auto'
  thumbHeight: 'auto',
  thumbTopOffset: 'auto',  // top offset in pixels or 'auto' for centering images within list height
  imagePadding: 4,
  easing: 'linear',
  duration: 'slow'
};

// applied options (overridden defaults)
var _options = {};


var _elCounter    = 0;
var _activeIndex 	= 0;      // index of initial active element
var _activeElem   = false;	// reference to active <li> dom element
var _listElem     = false;	// reference to <ul> list dom element

var _listWidth  = 0;	// list width (default: screen width)
var _listHeight = 0;	// list height (height of highest image)
var _centerX    = 0; 	// horizontal center within list
var _centerY    = 0; 	// vertical center within list


// stores initial image data (height, width, thumbHeight, thumbWidth)
// format: [{ 
//     h: 400, 		// full size image height
//     w: 200,		// full size image width
//     th: 100,		// thumb height
//     tw: 50		  // thumb width
// }]
var _imgData = []; 


// initialize:
var _initList = function(elem) {

  _listElem = elem; 

  var container = $(_listElem).css({
    listStyle: 'none',
    overflow: 'hidden',
    paddingLeft: '0',
    position: 'relative',
    width: '100%'
  }).parent();

  var wrapperElem = document.createElement('div');
  var captionElem = document.createElement('p');
  $(captionElem).addClass('bf-caption').css({
    backgroundColor: _options.backgroundColor,
    display: 'none',
    marginTop: '0',
    padding: '8px ' + (_options.imagePadding+10) + 'px 15px',
    position: 'absolute'
  });

  $(wrapperElem).addClass('bf-wrapper').css({
    position: 'relative'
  }).append(_listElem).append(captionElem);
  container.append(wrapperElem);

  $(window).resize(function(){
    _listWidth = $(document.body).width();
    _centerX = _listWidth*0.5;
    _updateFlow();
    _showCaption(_activeElem);
  });


  var listItems = $(_listElem).children();

  // loop through list items to extract image data and determine list height
  listItems.each(function(index) {
    var img = $(this).find('img');
    if(_options.forceWidth) {
      img.width(_options.forceWidth);
    }

    var isLoaded = _isImageLoaded(img.get(0));
    var dimensions = _getImageDimensions(img, isLoaded);
    var imageHeight = dimensions.h;
    _imgData.push(dimensions);

    if(!isLoaded) {
      _addLoadHandler(img, index);
    }

    //console.log("img data: ", imageHeight, img.width(), thumbHeight, _options.thumbWidth);

    

    _initListItem(this, index);
  });

  
  _listWidth = $(document.body).width();
  _centerX = _listWidth*0.5;

  _centerY = _options.thumbTopOffset==='auto' ? _listHeight * 0.5 : _options.thumbTopOffset;

  _updateFlow();
}


var _initListItem = function(elem, index) {

  $(elem).css({
    backgroundColor: _options.backgroundColor,
    position: 'absolute',
    textAlign: 'center'
  }).find('img').css({
    cursor: 'pointer',
    height: '100%',
    imageRendering: 'optimizeQuality', // firefox property
    //-ms-interpolation-mode: 'bicubic',  // IE property
    width: '100%'
  });

  if(!_activeElem && _options.activeIndex==index) {
    $(elem).addClass('active');
    _activeElem = elem;
    _activeIndex = index;
  }

  _elCounter++;

  $(elem).click(function(){
    if(this != _activeElem) {
      $("p.bf-caption").hide();
      _activeIndex = 0;
      _activeElem = this;
      $(this).parent().children().each(function(i){
        if(_activeElem==this) {
          _activeIndex = i;
        }
      });
      $(_listElem).children().stop();
      $(_listElem).find('.active').removeClass('active');
      $(this).addClass('active');

      // update width (changes if scrollbars disappear)
      _listWidth = $(document.body).width();
      _centerX = _listWidth*0.5;

      _updateFlow(_options.animate);
    }
  });
}


var _updateFlow = function(animate) {
  var isBefore = true;
  var leftOffset, topOffset, elWidth, elHeight, padding = 0;
  var completeFn = null;

  var afterFlowFn = function(){
    _showCaption(_activeElem);

    // adjust if width changed (i.e. if scrollbars get displayed)
    if($(document.body).width() != _listWidth) {
      _listWidth = $(document.body).width();
      _centerX = _listWidth*0.5;
      _updateFlow();
      _showCaption(_activeElem);
    }
  }

  var config = {};
  $(_listElem).children().each(function(i){
    if($(this).hasClass('active')) {
      config = {
        left: (_centerX - _options.imagePadding - _imgData[i].w * 0.5) + 'px',
        top: '0',
        width: _imgData[i].w+'px',
        height: _imgData[i].h+'px',
        padding: _options.imagePadding+'px'
      }
      isBefore = false;
      completeFn = afterFlowFn;
    } else {
      config = {
        left: (isBefore ? (_centerX - _options.imagePadding - _imgData[_activeIndex].w*0.5 +  (i-_activeIndex)*_imgData[i].tw + (i-1-_activeIndex)*10) : (_centerX + _options.imagePadding + _imgData[_activeIndex].w*0.5 + (i-_activeIndex-1)*_imgData[i].tw + (i-_activeIndex)*10)) + 'px',
        top: (_centerY - _imgData[i].th*0.5) + 'px',
        width: _imgData[i].tw+'px',
        height: _imgData[i].th+'px',
        padding: '3px'
      }
      completeFn = null;
    }

    // TODO: only animate visible images...
    if(animate) {
      $(this).animate(config, { duration: _options.duration, easing: _options.easing, complete: completeFn });
    } else {
      $(this).css(config);
      afterFlowFn();
    }

  });
}


var _showCaption = function(elem) {
  var caption = $(elem).parent().parent().find('p.bf-caption');
  var captionText = $(elem).find('img').attr('title');
  caption.text(captionText);

  caption.css({
    left: _centerX - _options.imagePadding - _imgData[_activeIndex].w * 0.5,
    top: _imgData[_activeIndex].h + _options.imagePadding*2,
    width: _imgData[_activeIndex].w - 20
  })

  // set height of caption as bottom margin for list
  var fullHeight = $(_listElem).height() + caption.height() + 40;
  $(_listElem).parent().height(fullHeight);

  caption.fadeIn('fast');
}


// returns image dimensions (isLoaded default: false) 
var _getImageDimensions = function(img, isLoaded) {
  var isLoaded = isLoaded || false;

  if(isLoaded) {
    var imgHeight = _options.forceHeight || img.attr('naturalHeight');
    //console.log("h: ", imgHeight);
    var thumbHeight = _options.thumbHeight === 'auto' ? Math.round(imgHeight*Number(_options.thumbWidth) / img.attr('naturalWidth')) : _options.thumbHeight;
    var imgWidth = img.attr('naturalWidth');
  } else {
    var thumbHeight = _options.thumbHeight === 'auto' ? 50 : _options.thumbHeight;
    var imgHeight = thumbHeight;
    var imgWidth = _options.thumbWidth;
  }

  _updateListHeight(imgHeight);

  return {h:imgHeight, w:imgWidth, th:thumbHeight, tw:_options.thumbWidth}
}


// checks if image has been fully loaded
var _isImageLoaded = function(img) {
  if(!img.complete) {
    return false;
  }
  if(typeof img.naturalWidth != "undefined" && img.naturalWidth==0) {
    return false;
  }
  return true;
}


_activeLoaded = false;

// handle loading of incomplete images
var _addLoadHandler = function(img, index) {

  _options.loadingClass = "loading";
  img.hide().parent().addClass(_options.loadingClass).css({
    height: _imgData[index].th,
    width: _imgData[index].tw
  });

  img.bind('load readystatechange', function(e){
    if (this.complete || (this.readyState == 'complete' && e.type =='readystatechange')) {
      $(this).css('visibility', 'visible').parent().removeClass(_options.loadingClass);
      $(this).fadeIn();

      var dimensions = _getImageDimensions(img, true);
      _imgData[index] = dimensions;

      if(index==_activeIndex) {
        _activeLoaded = true;
        _centerY = _options.thumbTopOffset==='auto' ? dimensions.h*0.5 : _options.thumbTopOffset;
        _updateFlow();
      } else {
        var animateParams = { height: dimensions.th };
        if(_activeLoaded) {
          animateParams.top = (_centerY - _imgData[index].th*0.5) + 'px';
        }
        img.parent().animate(animateParams);
      }
    }
  })
  .bind('error', function () {
    $(this).css('visibility', 'visible').parent().removeClass(_options.loadingClass);
  });
}


// set list height to height of tallest image (needed for overflow:hidden)
var _updateListHeight = function(height) {
  if(height > _listHeight) {
    _listHeight = height;
    _listHeight += _options.imagePadding*2;
    $(_listElem).height(_listHeight);
  }
}


})(jQuery);
