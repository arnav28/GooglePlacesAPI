(function () {
    'use strict';

    angular.module('app.services', [])

        .constant('FirebaseUrl', 'https://googleplaces.firebaseio.com/')

    // firebase root reference
        .service("FireDB", ["FirebaseUrl", function (FirebaseUrl) {
            var ref = new Firebase(FirebaseUrl);
            return ref;
        }])  
        
        
    // Firebase auth warpper
        .service("Auth", ["$firebaseAuth", "FirebaseUrl", function ($firebaseAuth, FirebaseUrl) {
            var ref = new Firebase(FirebaseUrl);
            return $firebaseAuth(ref);
        }])
        
        
    // Service for handling authentication
        .service("AuthService", ["FireDB", "Auth", "$state", function (FireDB, Auth, $state) {
            
            // Google Login
            this.login = function () {
                Auth.$authWithOAuthPopup("google").then(function (authData) {
                }).catch(function (error) {
                    console.error("Authentication failed:", error);
                });
            };
    
            // Check users authentication state
            this.state = function () {
                return Auth.$onAuth(function (user) {
                    if (user) {
                        var ref = FireDB.child("Users").child(user.uid);
                        // Check if user already exists
                        ref.once('value', function (snap) {
                            var name = getName(user);
                            if (snap.val() === null) {
                                // save the user profile 
                                ref.set({
                                    Provider: user.provider,
                                    Name: name,
                                    Date: Firebase.ServerValue.TIMESTAMP
                                });
                            } else {
                                // Only update user's full name
                                ref.update({
                                    Name: name
                                });
                            }
                            // On success redirect to dashboard
                            $state.go('dashboard');
                        });
                    } else {
                        // Else redirect to home/login
                        $state.go('home');
                    }
                });
            };
            
            // Get full name depending on social provider
            function getName(user) {
                if (user.provider == 'google') {
                    return user.google.displayName;
                }
            }

        }])
        
    // Map service 
        .service("MapService", ["FirebaseUrl", "$rootScope", "$q", function (FirebaseUrl, $rootScope, $q) {
            
            // Load map 
            this.initialize = function () {               
                this.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 5
                });   
                
                var mapCenter = this.checkLocation();
                
                // Initiate Google places service             
                this.service = new google.maps.places.PlacesService(this.map);
                
                // Markers & infoWindow object in global scope 
                $rootScope.markers = [];
                $rootScope.infoWindow = new google.maps.InfoWindow();
            };
            
            // Check if user location is set 
            // Otherwise default it to US coordinates
            this.checkLocation = function(){
                if($rootScope.location){
                    this.map.setCenter($rootScope.location);
                    this.map.setZoom(12);
                    return $rootScope.location;
                }else{
                    var defaultLoc = { lat: 39.5, lng: -98.35 };
                    this.map.setCenter(defaultLoc);
                    return defaultLoc;
                }
            };

            // Search 
            this.search = function (text) {   
                // run asynchronously             
                var d = $q.defer();
                var searchArea = this.checkLocation();
                // Create request for google places api
                var request = { location: searchArea,
                    radius: '500',
                    query: text
                };
                this.service.textSearch(request, function (results, status) {
                    // On Success
                    if (status == 'OK') {
                        d.resolve(results);
                    }
                    // On error
                    else d.reject(status);
                });
                return d.promise;
            };

            this.initMarkers = function (places) {
                // Get map object 
                var mapObject = this.map;
                // Loop through places and set marker
                for (var i = 0; i < places.length; i++) {
                    this.setMarker(places[i], mapObject);
                }
            };
            
            // Set marker for each place on a map
            // Set infowindow with content
            this.setMarker = function(place, mapObject){
                // Optimize icon 
                var icon = { url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };
                    // Set marker on map
                    var marker = new google.maps.Marker({
                        map: mapObject,
                        icon: icon,
                        title: place.name,
                        position: place.geometry.location
                    });
                    // Store markers in glocal scope
                    $rootScope.markers.push(marker);
                    
                    // Click event for marker
                    // Set infowindow content and create google maps directions url
                    google.maps.event.addListener(marker, 'click', function() {
                        var placeStatus;
                        // check if place is open
                        if(place.opening_hours){
                            if(place.opening_hours.open_now === true){
                                placeStatus = "Open now";
                            }else{
                                placeStatus = "Currently closed";
                            }
                        }else{
                           placeStatus = ""; 
                        }
                        var contentString = "<div class='markerWindow'><p class='title'>" +place.name+ " &nbsp; <a target='_blank'' href='https://www.google.com/maps/dir/" + $rootScope.location.lat + "," + $rootScope.location.lng + "/" + place.formatted_address + "' class='link-btn btn-sm btn-primary'>Directions</a></p>" + 
                                            "<p>Address : " +place.formatted_address+ "</p>" +
                                            "<p>" + placeStatus + "</p>" +
                                            "</div>";
                        $rootScope.infoWindow.setContent(contentString);
                        $rootScope.infoWindow.open(mapObject, this);
                    });
                    
                    // Close infoWindow if clicked on map
                    google.maps.event.addListener(mapObject, 'click', function() {
                        $rootScope.infoWindow.close();
                    });
            };
        
        // Get users current location for google map
            this.currentLocation = function () {
                // HTML5 geolocation
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        var pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        // Store user location
                        $rootScope.location = pos;
                    }, this.geoLocationError);
                }
                // Browser doesn't support Geolocation
                else {
                    alert("Your browser does not support geolocation");
                }
            };
            
            // Catch geolocation errors and alert user
            this.geoLocationError = function(error){
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        alert("Please allow location tracking for better results");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Location information is unavailable.");
                        break;
                    case error.TIMEOUT:
                        alert("The request to get user location timed out.");
                        break;
                    case error.UNKNOWN_ERROR:
                        alert("An unknown error occurred.");
                        break;
                }
            };
        }])
        
        // Serivce for storing datat to Firebase
        .service("DataService", ["FireDB", "$firebaseArray", function (FireDB, $firebaseArray) {
            
            // Save search queries of current user
            this.saveSearch = function(text, uid){
                var ref = FireDB.child("SearchQueries").child(uid);
                ref.push({
                    query: text, 
                    time: Firebase.ServerValue.TIMESTAMP,
                });
            };
            
            // Retrieve all search queries of current user
            this.getQueries = function(uid){
                var list = $firebaseArray(FireDB.child("SearchQueries").child(uid));
                return list;
            };
        }]);

})();