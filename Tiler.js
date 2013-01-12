"use strict";

var Tiler = (function($, ko) {

    var unusedImages = ko.observableArray();
    var usedImages = ko.observableArray();

    function fileSelector_OnChange(event) {
        var files = event.target.files;
        var regexImage = /image\/.+/;
        for(var idx = 0; idx<files.length; ++idx) {
            if(!files[idx].type.match(regexImage)) {
                console.warn(files[idx].name + " is not an image.");
                continue;
            }
            var reader = new FileReader();
            reader.onload = (function (theFile) {
               return function(e) {
                   var img = new Image();
                   img.setAttribute("data-name", theFile.name);
                   var data = {
                       image: img,
                       src: e.target.result,
                       name: theFile.name,
                       loaded: ko.observable(false),
                       width: 0,
                       height: 0,
                       widthInTiles: ko.observable(0),
                       heightInTiles: ko.observable(0),
                       split: splitImage.bind(img)
                   };

                   img.onload = function() {
                       this.setAttribute("data-loaded", "true");
                       data.loaded(true);
                       data.width = this.width;
                       data.height = this.height;
                       data.widthInTiles(this.width / 32);
                       data.heightInTiles(this.height / 32);
                   };
                   img.src = data.src;

                   unusedImages.push(data);
               };
            })(files[idx]);
            reader.readAsDataURL(files[idx]);
        }
    }

    function splitImage() {
        var image = this;
        var canvas = document.createElement("canvas");
        canvas.height = canvas.width = 32;
        var context = canvas.getContext("2d");
        var ret = [];

        for(var y=0; y<image.height; y += 32) {
            for(var x=0; x<image.width; x += 32) {
                context.clearRect(0, 0, 32, 32);
                context.drawImage(image, x, y, 32, 32, 0, 0, 32, 32);
                var img = new Image();
                img.src = canvas.toDataURL();
                ret.push(img);
            }
        }

        return ret;
    }

    /** @enum */
    var STATE = { None: 'None', Add: 'Add', Delete: 'Delete', Move: 'Move', Compare: 'Compare', Save: 'Save' };

    var ret = {
        filesSelected: fileSelector_OnChange,
        images: {
            used: usedImages,
            unused: unusedImages,
            toDelete: ko.observableArray()
        },
        _state: ko.observable(),

        STATES: STATE
    };

    ret.state = ko.computed({
        read: function() {
            switch(this._state()) {
                case STATE.Add:
                    if(this.images.unused().length > 0)
                        return this._state();
                    else
                        return STATE.None;
                    break;

                default:
                    return this._state();
            }
        },
        write: function(value) {
            var oldState = this._state();
            if(oldState === value)
                return;

            this._state(value);

            if(value === STATE.Move) {
                $("#tbl").find("tr > td > img").draggable({ snap: "#tbl td", snapMode: 'inner' });
            } else if(oldState === STATE.Move) {
                $("#tbl").find("tr > td > img").draggable("destroy");
            }
        },
        owner: ret
    });

    return ret;
})(jQuery, ko);

ko.bindingHandlers.allowBindings = {
    init: function(elem, valueAccessor) {
        // Let bindings proceed as normal *only if* my value is false
        var shouldAllowBindings = ko.utils.unwrapObservable(valueAccessor());
        return { controlsDescendantBindings: !shouldAllowBindings };
    }
};