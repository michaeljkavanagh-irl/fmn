import { LatLng } from '../latLng';
import { LatLngBounds } from "../latLngBounds";
import { ComponentRestrictions } from "./componentRestrictions";
export declare class Options {
    bounds: LatLngBounds;
    componentRestrictions: ComponentRestrictions;
    types: string[];
    fields: string[];
    strictBounds: boolean;
    origin: LatLng;
    constructor(opt?: Partial<Options>);
}
