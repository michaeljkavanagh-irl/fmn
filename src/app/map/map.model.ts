import { SessionDataLayer } from './datalayer.model';

export interface Map {
  mapName: string;
  mapType: string;
  _id: string;
  createddate: string;
  mapDataLayers: SessionDataLayer[];
  lastCoordinates: number[];
  lastBearing: number;
  lastPitchLevel: number;
  lastZoomLevel: number;
  creator: string;
  sharedWith: any[];
  preStyledLayers: any[];
  preStyledLayerVisibility: any[];
}
