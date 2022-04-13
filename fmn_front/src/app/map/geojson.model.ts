
export interface IGeometry {
  type: string;
  coordinates: number[];
}

export interface IGeoJson {
  type: string;
  geometry: IGeometry;
  properties?: any;
}

export class GeoJson implements IGeoJson {
  type: 'Feature';
  geometry: IGeometry;

  constructor(coordintates, public properties?) {
    this.geometry = {
      type: 'Point',
      coordinates: coordintates
    };
  }
}

export class FeatureCollection {
  type = 'FeatureCollection';
  constructor(public features: Array<GeoJson>) {
  }
}
