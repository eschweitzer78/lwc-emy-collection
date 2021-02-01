# leafletMap as a Lightning Web Component

Bring your own Mapbox API Key.
Features geolocation as well as amending the location.

Based on [Leaflet](https://github.com/Leaftlet/Leaftlet)
Copyright (c) 2010-2021, Vladimir Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

The Leaflet source code has been included for convenience since Salesforce requires all JavaScript to be included as static resources.

## What do I get?

- 4 LWC components
  - a composite `leafletLocator`
  - `leafletMap`, a map panel,
  - `leafletLocationPanel`, a panel that enables to display and edit the current location and precision radius,
  - `mapboxGeocoder`, a component that leverages MapBox to reverse geocode the location into a suburb name or potentially a full address.
- An Apex class that retrieves a MapBox API key stored as custom metadata (`LeafletLocatorSetting`)
- Static resources with Leaflet 1.6.0

## Improvements

We plan on adding Remote Site Settings very shortly, as well as automated deployment from github.

