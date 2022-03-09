export interface Photo {
    height: number;
    html_attributions: string[];
    width: number;
    getUrl(request: PhotoRequest): string;
}
export declare class PhotoRequest {
    maxWidth: number;
    maxHeight: number;
}
