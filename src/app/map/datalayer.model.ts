import { GeoJson } from './geojson.model';

export interface DataLayer {
  datalayers: {
    filename: string;
  };
}

export interface SessionDataLayer {
  name: string;
  originalName: string;
  type: string;
  styleType: string;
  id: string;
  ownerLayerId: string;
  color: string;
  dataStyleColor: string;
  opacity: number;
  size: number;
  polyBorderWidth: number;
  lineType: string;
  flyToLocation: any;
  currentLabel: string;
  currentLabelSize: string;
  currentLabelVisibility: boolean;
  currentLabelColour: string;
  outlineColor: string;
  uniqueValueAssign: boolean,
  propertySelected: string,
  symbolInUse: string;
  dataDrivenStylingInUse: boolean;
  colourRamp: string;
  colourPalette: string;
  colourRampInUse: boolean;
  colourPaletteInUse: boolean;
  dataStyleField: string;
  dataStyleFieldType: string;
  visibility: boolean;
  uniqueProps: any[];
  uniquePropNumerical: any[];
  uniqueValueFilterList: any[];
  ownerProject: any;
}
