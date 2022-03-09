// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  serverUrl: 'http://localhost:8081/',
  mapbox: {
    accessToken: 'pk.eyJ1Ijoib3VyY29sbGVjdGl2ZSIsImEiOiJja2Nmem44bGowbjVyMnJwYndlcHpueTl4In0.ZTTDR6WlA6BNA4JFxbNj4Q',
    baseUrl: 'mapbox://styles/ourcollective/',
    satteliteStyle: 'ckcg4f1ty0ri31iqrj5otd3qy',
    monoChromeStyle: 'ckcg02rv10nbz1iqrp7se47j0',
    transportStyle: 'ckks6erhp0qot18qyji0r1kqr',
    constructionLogisticsStyle: 'ckrm7yroj20cs17o1rs0uf1as',
    monoLight: 'ckk8d4hmw18vn18t3acls3j0u',
    staticAPIUrl: 'https://api.mapbox.com/styles/v1/ourcollective/ckcg02rv10nbz1iqrp7se47j0',
    staticAPIZoom: 9,
    staticAPIWidth: 50,
    staticAPIHeight: 50
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
