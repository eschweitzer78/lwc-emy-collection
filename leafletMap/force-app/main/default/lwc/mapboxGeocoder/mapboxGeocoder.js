import { LightningElement, api, track, wire } from 'lwc';
import mapBoxGeocoder_getAPIKey from '@salesforce/apex/MapboxGeocoderController.getAPIKey';

export default class MapboxGeocooder extends LightningElement {
    @api
    
    get location() {
        return { lat: this.lat, lon: this.lon };
    }

    set location(value) {
        if (typeof value === 'undefined' || value == null || (this.lat == value.lat && this.lon == value.lon))
            return;

        this.lat = value.lat;
        this.lon = value.lon;

        this.getLocality();
    };

    lat;
    lon;

    @api localityLat;
    @api localityLon;
    @api locality;
    accessToken;

    getLocality() {
        var lat = this.lat;
        var lng = this.lon;
        
        if (lat === undefined || lat === null || lng === undefined || lng === null) {
            return;
        }

        new Promise((resolve, reject) => {
            if (this.accessToken == null || this.accessToken == '') {
                mapBoxGeocoder_getAPIKey()
                .then(result => { this.accessToken = result; })
                .catch(error => { reject(error); }) 
            } else {
                resolve();
            }
        })
        .then(() => {

            var apiURL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
                lng + ',' + lat + '.json?' +
                'types=locality&' +
    /*            'country=AU&' + */
                'access_token=' + this.accessToken;
            
            fetch(apiURL)
            .then(response => response.json())
            .then(data => {                
                if (data === undefined ||
                    data.type === undefined ||
                    data.type !== 'FeatureCollection') {
                    return;
                }
                
                data.features.forEach(feature => {
                    if (feature.type === undefined || feature.type !== 'Feature') {
                    } else {
                        var locality = this.locality;
                        if (locality !== feature.place_name) {
                            this.locality = feature.place_name;
                            this.localityLon = feature.center[0];
                            this.localityLat = feature.center[1];
                        }
                    }
                });
                
                this.localityChangeHandler(); // dispatch event
            })
            .catch(error => {
                this.locality = '';
                this.localityLat = 0;
                this.localityLon = 0;
                console.log('Error ', error);
            });    
        })
        .catch(error =>  {
            this.locality = '';
            this.localityLat = 0;
            this.localityLon = 0;
            console.log('Error ', error);
        });
    }

    localityChangeHandler() {
        this.dispatchEvent(new CustomEvent('localitychange'));
    }
}
