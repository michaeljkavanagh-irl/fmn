(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core'], factory) :
	(factory((global.ng = global.ng || {}, global.ng['ngx-google-places-autocomplete'] = global.ng['ngx-google-places-autocomplete'] || {}),global.ng.core));
}(this, (function (exports,_angular_core) { 'use strict';

var Options = (function () {
    /**
     * @param {?=} opt
     */
    function Options(opt) {
        if (!opt)
            return;
        Object.assign(this, opt);
    }
    return Options;
}());

var GooglePlaceDirective = (function () {
    /**
     * @param {?} el
     * @param {?} ngZone
     */
    function GooglePlaceDirective(el, ngZone) {
        this.el = el;
        this.ngZone = ngZone;
        this.onAddressChange = new _angular_core.EventEmitter();
    }
    /**
     * @return {?}
     */
    GooglePlaceDirective.prototype.ngAfterViewInit = function () {
        if (!this.options)
            this.options = new Options();
        this.initialize();
    };
    /**
     * @return {?}
     */
    GooglePlaceDirective.prototype.isGoogleLibExists = function () {
        return !(!google || !google.maps || !google.maps.places);
    };
    /**
     * @return {?}
     */
    GooglePlaceDirective.prototype.initialize = function () {
        var _this = this;
        if (!this.isGoogleLibExists())
            throw new Error("Google maps library can not be found");
        this.autocomplete = new google.maps.places.Autocomplete(this.el.nativeElement, this.options);
        if (!this.autocomplete)
            throw new Error("Autocomplete is not initialized");
        if (!this.autocomplete.addListener != null) {
            this.eventListener = this.autocomplete.addListener('place_changed', function () {
                _this.handleChangeEvent();
            });
        }
        this.el.nativeElement.addEventListener('keydown', function (event) {
            if (!event.key) {
                return;
            }
            var /** @type {?} */ key = event.key.toLowerCase();
            if (key == 'enter' && event.target === _this.el.nativeElement) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
        // according to https://gist.github.com/schoenobates/ef578a02ac8ab6726487
        if (window && window.navigator && window.navigator.userAgent && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
            setTimeout(function () {
                var /** @type {?} */ containers = document.getElementsByClassName('pac-container');
                if (containers) {
                    var /** @type {?} */ arr = Array.from(containers);
                    if (arr) {
                        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                            var container = arr_1[_i];
                            if (!container)
                                continue;
                            container.addEventListener('touchend', function (e) {
                                e.stopImmediatePropagation();
                            });
                        }
                    }
                }
            }, 500);
        }
    };
    /**
     * @return {?}
     */
    GooglePlaceDirective.prototype.reset = function () {
        this.autocomplete.setComponentRestrictions(this.options.componentRestrictions);
        this.autocomplete.setTypes(this.options.types);
    };
    /**
     * @return {?}
     */
    GooglePlaceDirective.prototype.handleChangeEvent = function () {
        var _this = this;
        this.ngZone.run(function () {
            _this.place = _this.autocomplete.getPlace();
            if (_this.place) {
                _this.onAddressChange.emit(_this.place);
            }
        });
    };
    GooglePlaceDirective.decorators = [
        { type: _angular_core.Directive, args: [{
                    selector: '[ngx-google-places-autocomplete]',
                    exportAs: 'ngx-places'
                },] },
    ];
    /**
     * @nocollapse
     */
    GooglePlaceDirective.ctorParameters = function () { return [
        { type: _angular_core.ElementRef, },
        { type: _angular_core.NgZone, },
    ]; };
    GooglePlaceDirective.propDecorators = {
        'options': [{ type: _angular_core.Input, args: ['options',] },],
        'onAddressChange': [{ type: _angular_core.Output },],
    };
    return GooglePlaceDirective;
}());

var GooglePlaceModule = (function () {
    function GooglePlaceModule() {
    }
    GooglePlaceModule.decorators = [
        { type: _angular_core.NgModule, args: [{
                    declarations: [GooglePlaceDirective],
                    exports: [GooglePlaceDirective]
                },] },
    ];
    /**
     * @nocollapse
     */
    GooglePlaceModule.ctorParameters = function () { return []; };
    return GooglePlaceModule;
}());

exports.GooglePlaceModule = GooglePlaceModule;
exports.GooglePlaceDirective = GooglePlaceDirective;

Object.defineProperty(exports, '__esModule', { value: true });

})));
