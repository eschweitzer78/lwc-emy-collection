import { LightningElement, api, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

export default class LeafletLocationPanel extends LightningElement {
    @api hasSelection;
    @api selectedLat;
    @api selectedLon;
    @api accuracy;
    @api locality;
    @api localityLat;
    @api localityLon;

    geoprivacyOptions = [
    	{ 'label': 'Public', value: 'Public' },
    	{ 'label': 'Obscured', value: 'Obscured' },
        { 'label': 'Private', value: 'Private' }
    ];

    @api geoprivacy;
    @api displayContext;
    @api displayOnly;
    @api detailsExpanded = false;

    get displayLat() { return (this.displayContext == this.geoprivacy || this.geoprivacy == 'Public') ? this.selectedLat : this.localityLat; }
    get displayLon() { return (this.displayContext == this.geoprivacy || this.geoprivacy == 'Public') ? this.selectedLon : this.localityLon; }

    get showDetails() {
        return this.displayContext == this.geoprivacy || this.geoprivacy == 'Public' || this.displayContext == 'Private';
    }

    latChangeHandler(event) {
        this.selectedLat = event.target.value;
        this.dispatchEvent(new CustomEvent('locationchange'));
    }    

    lonChangeHandler(event) {
        this.selectedLon = event.target.value;
        this.dispatchEvent(new CustomEvent('locationchange'));
    }    

    accuracyChangeHandler(event) {
        this.accuracy = event.target.value;
        this.dispatchEvent(new CustomEvent('accuracychange'));
    }

    geoprivacyChangeHandler(event) {
        this.geoprivacy = event.detail.value;
        this.dispatchEvent(new CustomEvent('geoprivacychange'));
    }

    toggleDisplayDetailsHandler(event) {
        this.detailsExpanded = !this.detailsExpanded;
    }
}