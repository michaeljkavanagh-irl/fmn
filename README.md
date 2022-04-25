![alt text](https://github.com/michaeljkavanagh-irl/fmn/blob/master/src/assets/images/MOngoDB_LDN.png?raw=true)

# 15 Minute Neighbourhood - Introduction

The concept of a 15 minute city or neighbourhood was first discussed by French Columbian scientist Carlos Moreno who published an article in 2021 describing the <a href="https://en.wikipedia.org/wiki/15-minute_city">15min city</a> or town as a place where its residents can fulfill 6 essential functions within a 15 minute walk or bike ride from their dwelling. These functions include: living, working, commerce, healthcare, education & entertainment. 

## Purpose

This application is NOT an official MongoDB product but rather a free (largely untested!) resource to 1) Test out the 15min city idea against various locations and addresses and 2) Being a reusable tool or resource to demonstrate the awesome capabilities of the MongoDB Atlas Application Data Platform. 


## Challenges
The application has some inherent challenges both conceptually and technically. 

Technical 
1) There are gaps in coverage where an adequate response from the Places API is not retrieved - and hence no results are displayed for certain locations.
2) Since the ISOChrone Polygon and the places are retrived from different vendors (Mapbox & HERE Technologies) it's possible some location data does lineup 100% (E.G. places which fall outside or inside the polygon)

Conceptual:
1) There are obviously millions of people that reside outside cities where there is a reliance on cars in order to fulfill these essential 6 functions. 
2) There is also a challenge is how to score the results. Is it better to live near a primary educational facility or a secondary or 3rd level? Is it better to live near a hospital or a private GP / Doctor surgery? 

## Tech Stack and APIs

Markup : * MongoDB
         * Express
         * Angular
         * NodeJS
         * Mapbox
         * Google (Address Autocomplete)
         * HERE Technologies (Places API)
         * Atlas Search
         * Atlas Charts
         * Atlas Realm Hosting


