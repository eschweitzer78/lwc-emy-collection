import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

import LeafletJS from '@salesforce/resourceUrl/leafletJS';

export default class LeafletMap extends LightningElement {
    @api geoprivacy = 'Public';
    @api displayContext = 'Public';
    @api displayOnly = false;
   
    @api defaultLat = '-25.73';
    @api defaultLon = '134.48';
    @api defaultZoom = 7;
    @api height = 600;

    isLoadingMap = false;
    isGettingLocation = false;
    isLoadingLocality = false;

    @api hasSelection = false;

    @api

    get selectedLat() {
        return this._location.lat;
    }

    set selectedLat(value) {
        this._location = { lat: value, lon: this._location.lon };
        this.adjustMap('Location');
    }

    @api 

    get selectedLon() {
        return this._location.lon;
    }

    set selectedLon(value) {
        this._location = { lon: value, lat: this._location.lat };
        this.adjustMap('Location');
    }

    _location = { lat: '-25.73', lon: '134.48' };

    @api
    
    get accuracy() {
        return this._accuracy;
    };

    set accuracy(value) {
        this._accuracy = value;
        this.adjustMap('Accuracy');
    }

    _accuracy = 15000;

    priorSelectedLat = null;
    priorSelectedLon = null;

    @api locality;
    @api localityLat;
    @api localityLon;

    @track map;
    @track marker;

    leafletInitialising = false;
    leafletInitialised = false;

    renderedCallback() {
        if (this.leafletInitialising == false && this.leafletInitialised == false) {
            this.leafletInitialising = true;
            this.initialiseLeaflet();
            return;
        }

        if (this.leafletInitialised == false) {
            return;
        }

        this.adjustMap('All');
    }

    initialiseLeaflet() {
        Promise.all([
            loadScript(this, LeafletJS + '/leaflet.js'),
            /*loadScript(this, LeafletJS + '/leaflet.geometryutil.js'),*/
            loadStyle(this, LeafletJS + '/leaflet.css'),
            loadStyle(this, LeafletJS + '/leaflet.draw.css'),
        ])
        .then(() => {
            var mapDiv = this.template.querySelector('.leaflet-map');
            mapDiv.style = `height: ${this.height}px;`;

            this.map = L.map(mapDiv, {}).setView([ parseFloat(this.defaultLat), parseFloat(this.defaultLon) ], this.defaultZoom);
            this.addLeafletPositionner();

            this.leafletInitialised = true;
            this.leafletInitialising = false;
                    
            this.prepareMap();
            this.adjustMap("All");

            this.mapReadyHandler();
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading Leaflet mapping library',
                    message: error.message,
                    variant: 'error'
                })
            );
        });
    }

    @api
    addTileLayer(url, params) {
        L.tileLayer(url, params).addTo(this.map);
    }

    prepareMap() {
        if (!this.displayOnly) {
            this.isGettingLocation = true;
            var leafletMap = this;

            this.map.on('locationfound', function(e) { leafletMap.setLocation(e); });        
            this.map.on('locationerror', function(e) { leafletMap.setLocation(null); });
  
            this.map.locate({
               setView: true,
               maxZoom: 18
            });
        } 
    }

    setLocation(e) {
        this.isGettingLocation = false;

        if (e == null) {
            this.hasSelection = true;
            return;
        }

        var bounds = e.latlng.toBounds(4 * Math.round(e.accuracy));

        this.map.panTo(e.latlng).fitBounds(bounds);
                
        this.hasSelection = true;
        this._location = { lat: e.latlng.lat, lon: e.latlng.lng };
        this._accuracy = Math.round(e.accuracy);

        this.locationChangeHandler(); // dispatch event
        this.accuracyChangeHandler(); // dispatch event
    }

    /**
     * 
     * @param {*} changeType accepted values include Display and All
     */
    adjustMap(changeType) {
        var displayOnly = this.displayOnly;
        var displayContext = this.displayContext;
        
        if (displayOnly == null || displayContext == null) return;
        
        var geoprivacy = this.geoprivacy;
        
        // If we're displaying and we don't have geoprivacy info, bail out
        if (displayOnly === true && geoprivacy == null) return;
        
        // If we're editing and the change is about display attribute, bail out
        if (displayOnly === false && changeType === 'Display') return;
        
        var obscure = !((displayContext === geoprivacy) || (displayContext === 'Private'));
        
        var localityLat = this.localityLat;
        var localityLon = this.localityLon;
        var selectedLat = this._location.lat;
        var selectedLon = this._location.lon;

        // If we display and are in obscure mode, we need the locality
        // If we display and are in full mode, we need the selected location        
        if (displayOnly === true) {
            if (obscure) {
                if (localityLat == null || localityLon == null) return;
            } else {
                if (selectedLat == null || selectedLon == null) return;
            }
        }

        var mymap = this.map;
        var radius = this._accuracy / 2;
        
        if (mymap == null) return;

        if (displayOnly) {
            // show display location
            
            var lat = obscure ? localityLat : selectedLat;
            var lon = obscure ? localityLon : selectedLon;
            var latlng = L.latLng(lat, lon);

            // Add a marker or move it if it exists already
            var marker = this.marker;
            if (marker != null) {
                mymap.removeLayer(marker);
            }
            
            if (obscure) {
                marker = L.marker(latlng);
                mymap.addLayer(marker);
                this.marker = marker;
            } else {
                var circle = L.circle(latlng, radius);
                mymap.addLayer(circle);
                this.marker = circle;
            }
            
            var bounds = latlng.toBounds(obscure ? 50000 : Math.max(125, 4 * radius)); // 50km if obscured
            mymap.panTo(latlng).fitBounds(bounds);
        } else {
            if (selectedLat != null && selectedLon != null && radius != null && !isNaN(radius)) {                
                var circle = this.marker;
                if (circle !== undefined && circle != null) {
                    mymap.removeLayer(circle);
                }
                
                var latlng = L.latLng(selectedLat, selectedLon);                
                var circle = L.circle(latlng, radius);
                this.marker = circle;
                
                mymap.addLayer(circle);
                
                if (circle !== undefined && circle.editing !== undefined) {
                    circle.editing.enable();
                    
                    var leaftletMap = this;
                    circle.on("edit", function() {
                        var latlng = circle.getLatLng();
                        var acc = Math.round(circle.getRadius() * 2);
                        if (leaftletMap._accuracy !== acc) {
                            leaftletMap._accuracy = acc;
                            leaftletMap.accuracyChangeHandler(); // dispatch event
                        }

                        if (leaftletMap.selectedLat !== latlng.lat ||
                            leaftletMap.selectedLon !== latlng.lng) {
                                leaftletMap.selectedLat = latlng.lat;
                                leaftletMap.selectedLon = latlng.lng;
                                leaftletMap.locationChangeHandler(); // dispatch event
                        }
                    });
                }
                
                var bounds = latlng.toBounds(Math.max(125, 4 * radius));
                mymap.panTo(latlng).fitBounds(bounds);
                
            }
        }
    }

    addLeafletPositionner() {
        L.MyEditCircle = L.Handler.extend({
            options: {
                moveIcon: new L.DivIcon({
                    iconSize: new L.Point(8, 8),
                    className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
                }),
                resizeIcon: new L.DivIcon({
                    iconSize: new L.Point(8, 8),
                    className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
                }),
                touchMoveIcon: new L.DivIcon({
                    iconSize: new L.Point(20, 20),
                    className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move leaflet-touch-icon'
                }),
                touchResizeIcon: new L.DivIcon({
                    iconSize: new L.Point(20, 20),
                    className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize leaflet-touch-icon'
                }),
            },
            
            initialize: function (shape, options) {
                // if touch, switch to touch icon
                if (L.Browser.touch) {
                    this.options.moveIcon = this.options.touchMoveIcon;
                    this.options.resizeIcon = this.options.touchResizeIcon;
                }
              
                this._shape = shape;
                L.Util.setOptions(this, options);
            },
            
            // Add listener hooks to this handler
            addHooks: function () {
                var shape = this._shape;
                if (this._shape._map) {
                    this._map = this._shape._map;
                    shape.setStyle(shape.options.editing);
                    
                    if (shape._map) {
                        this._map = shape._map;
                        if (!this._markerGroup) {
                            this._initMarkers();
                        }
                        this._map.addLayer(this._markerGroup);
                    }
                }
            },
            
            // @method removeHooks(): void
            // Remove listener hooks from this handler
            removeHooks: function () {
                var shape = this._shape;

                if (shape == null) {
                    console.log('no shape on removeHoks');
                    return;
                }
                
                shape.setStyle(shape.options.original);
                
                if (shape._map) {
                    if (this._moveMarker) this._unbindMarker(this._moveMarker);
                    
                    if (this._resizeMarkers) {
                        for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
                            this._unbindMarker(this._resizeMarkers[i]);
                        }
                        this._resizeMarkers = null;
                    }

                    
                    if (this._markerGroup) {
                        this._map.removeLayer(this._markerGroup);
                        delete this._markerGroup;
                        this._markerGroup = null;
                    }
                }
                
                this._map = null;
            },
            
            // @method updateMarkers(): void
            // Remove the edit markers from this layer
            updateMarkers: function () {
                this._markerGroup.clearLayers();
                this._initMarkers();
            },
            
            _initMarkers: function () {
                if (!this._markerGroup) {
                    this._markerGroup = new L.LayerGroup();
                }
                
                // Create center marker
                this._createMoveMarker();
                
                // Create edge marker
                this._createResizeMarker();
            },
            
            _createMoveMarker: function () {
                var center = this._shape.getLatLng();
                
                this._moveMarker = this._createMarker(center, this.options.moveIcon);
            },
            
            _createMarker: function (latlng, icon) {
                // Extending L.Marker in TouchEvents.js to include touch.
                var marker = new L.Marker(latlng, // new L.Marker.Touch(latlng,
                  {
                    draggable: true,
                    icon: icon,
                    zIndexOffset: 10
                });
                
                this._bindMarker(marker);                
                this._markerGroup.addLayer(marker);
                
                return marker;
            },
            
            _bindMarker: function (marker) {
                marker
                .on('dragstart', this._onMarkerDragStart, this)
                .on('drag', this._onMarkerDrag, this)
                .on('dragend', this._onMarkerDragEnd, this)
                .on('touchstart', this._onTouchStart, this)
                .on('touchmove', this._onTouchMove, this)
                .on('MSPointerMove', this._onTouchMove, this)
                .on('touchend', this._onTouchEnd, this)
                .on('MSPointerUp', this._onTouchEnd, this);
            },
            
            _unbindMarker: function (marker) {
                marker
                .off('dragstart', this._onMarkerDragStart, this)
                .off('drag', this._onMarkerDrag, this)
                .off('dragend', this._onMarkerDragEnd, this)
                .off('touchstart', this._onTouchStart, this)
                .off('touchmove', this._onTouchMove, this)
                .off('MSPointerMove', this._onTouchMove, this)
                .off('touchend', this._onTouchEnd, this)
                .off('MSPointerUp', this._onTouchEnd, this);
            },
            
            _onMarkerDragStart: function (e) {
                var marker = e.target;
                marker.setOpacity(0);
                
                this._shape.fire('editstart');
            },
            
            _fireEdit: function () {
                this._shape.edited = true;
                this._shape.fire('edit');
            },
            
            _onMarkerDrag: function (e) {
                var marker = e.target,
                    latlng = marker.getLatLng();
                
                if (marker === this._moveMarker) {
                    this._move(latlng);
                } else {
                    this._resize(latlng);
                }
                
                this._shape.redraw();
                this._shape.fire('editdrag');
            },
            
            _onMarkerDragEnd: function (e) {
                var marker = e.target;
                marker.setOpacity(1);
                
                this._fireEdit();
            },
            
            _onTouchStart: function (e) {
                L.MyEditCircle.prototype._onMarkerDragStart.call(this, e);
                
                if (typeof(this._getCorners) === 'function') {
                    // Save a reference to the opposite point
                    var corners = this._getCorners(),
                        marker = e.target,
                        currentCornerIndex = marker._cornerIndex;
                    
                    marker.setOpacity(0);
                    
                    // Copyed from Edit.Rectangle.js line 23 _onMarkerDragStart()
                    // Latlng is null otherwise.
                    this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];
                    this._toggleCornerMarkers(0, currentCornerIndex);
                }
                
                this._shape.fire('editstart');
            },

            _onTouchMove: function (e) {
                var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
                    latlng = this._map.layerPointToLatLng(layerPoint),
                    marker = e.target;
                
                if (marker === this._moveMarker) {
                    this._move(latlng);
                } else {
                    this._resize(latlng);
                }
                
                this._shape.redraw();
                
                // prevent touchcancel in IOS
                // e.preventDefault();
                return false;
            },
            
            _onTouchEnd: function (e) {
                var marker = e.target;
                marker.setOpacity(1);
                this.updateMarkers();
                this._fireEdit();
            },
        
            _move: function (latlng) {
                if (this._resizeMarkers.length) {
                    var resizemarkerPoint = this._getResizeMarkerPoint(latlng);
                    // Move the resize marker
                    this._resizeMarkers[0].setLatLng(resizemarkerPoint);
                }
                
                // Move the circle
                this._shape.setLatLng(latlng);
                
                // TODO this._map.fire(L.Draw.Event.EDITMOVE, {layer: this._shape});
            },  
            
            _createResizeMarker: function () {
                var center = this._shape.getLatLng(),
                    resizemarkerPoint = this._getResizeMarkerPoint(center);
                
                this._resizeMarkers = [];
                this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
            },
            
            _getResizeMarkerPoint: function (latlng) {
                // From L.shape.getBounds()
                var delta = this._shape._radius * Math.cos(Math.PI / 4),
                    point = this._map.project(latlng);
                return this._map.unproject([point.x + delta, point.y - delta]);
            },
            
            _resize: function (latlng) {
                var radius;
                var moveLatLng = this._moveMarker.getLatLng();
                
                radius = this._map.distance(moveLatLng, latlng);
                this._shape.setRadius(radius);
                
                // TODO this._map.fire(L.Draw.Event.EDITRESIZE, {layer: this._shape});
            }
        });     
        
        L.Circle.addInitHook(function () {
            this.editing = new L.MyEditCircle(this);
            
            if (this.options.editable) {
                this.editing.enable();
            }
            
            this.on('add', function () {
                if (this.editing && this.editing.enabled()) {
                    this.editing.addHooks();
                }
            });
            
            this.on('remove', function () {
                if (this.editing && this.editing.enabled()) {
                    this.editing.removeHooks();
                }
            });
        });
    }

    
    locationChangeHandler() {
        this.dispatchEvent(new CustomEvent('locationchange'));
    }

    accuracyChangeHandler() {
        this.dispatchEvent(new CustomEvent('accuracychange'));
    }

    mapReadyHandler() {
        this.dispatchEvent(new CustomEvent('mapready'));
    }
}