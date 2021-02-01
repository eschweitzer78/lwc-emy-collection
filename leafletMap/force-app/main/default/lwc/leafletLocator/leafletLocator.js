import { LightningElement, api, track } from 'lwc';

import mapBoxGeocoder_getAPIKey from '@salesforce/apex/MapboxGeocoderController.getAPIKey';

export default class LeafletMapLocator extends LightningElement {
    @api title = 'Select Location';
    @api iconName = 'custom:custom78';

    @api defaultLat = '-25.73';
    @api defaultLon = '134.48'; 
    @api defaultZoom = 7;
    @api mapHeight = 600;

    @api displayContext = 'Public';
    @api displayOnly = false;

    @api hasSelection = false;

    @api
    
    get selectedLat() { return this.selection.lat; };
    set selectedLat(value) { this.selection = { lon: this.selection.lon, lat: value }; };

    @api
    
    get selectedLon() { return this.selection.lon; };
    set selectedLon(value) { this.selection = { lat: this.selection.lat, lon: value }; };

    @track selection = { lat: '-25.73', lon: '134.48' };

    @api accuracy = 15000;

    @api locality;
    @api localityLat;
    @api localityLon;

    @api geoprivacy = 'Public';

    get doNotDisplay() { return this.geoprivacy === 'Private' && this.displayContext !== 'Private'; }
    get doNotDisplayStyle() { return `height: ${this.mapHeight}px;`; }

    locationChangeHandler(event) {
        this.selection = { lon: event.target.selectedLon, lat: event.target.selectedLat };
    }

    accuracyChangeHandler(event) {
        this.accuracy = event.target.accuracy;
    }

    localityChangeHandler(event) {
        this.localityLon = event.target.localityLon; 
        this.localityLat = event.target.localityLat; 
        this.locality = event.target.locality;
    }

    geoprivacyChangeHandler(event) {
        this.geoprivacy = event.target.geoprivacy;
    }

    accessToken;

    mapReadyHandler() {
        new Promise((resolve, reject) => {
            if (this.accessToken == null || this.accessToken == '') {
                mapBoxGeocoder_getAPIKey()
                .then(result => { this.accessToken = result; resolve(); })
                .catch(error => { reject(error); }) 
            } else {
                resolve();
            }
        })
        .then(() => {
            const map = this.template.querySelector('c-leaflet-map');

            if (map) {
                map.addTileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18,
                    id: 'mapbox/streets-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: this.accessToken
                });
            } 
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error while retrieving MapBox API key',
                    message: error ? error.message : 'No details.',
                    variant: 'error'
                })
            );
        });
    }
}