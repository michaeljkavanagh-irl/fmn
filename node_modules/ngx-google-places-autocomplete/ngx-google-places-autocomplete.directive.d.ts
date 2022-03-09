import { AfterViewInit, ElementRef, EventEmitter, NgZone } from "@angular/core";
import { Address } from "./objects/address";
import { Options } from "./objects/options/options";
export declare class GooglePlaceDirective implements AfterViewInit {
    private el;
    private ngZone;
    options: Options;
    onAddressChange: EventEmitter<Address>;
    private autocomplete;
    private eventListener;
    place: Address;
    constructor(el: ElementRef, ngZone: NgZone);
    ngAfterViewInit(): void;
    private isGoogleLibExists();
    private initialize();
    reset(): void;
    private handleChangeEvent();
}
