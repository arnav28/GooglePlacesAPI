(function () {
    'use strict';

    angular.module('app.controllers', [])

        .controller("HomeCtrl", ["$scope", "AuthService", function ($scope, AuthService) {
            
            // Login
            $scope.login = function () {
                AuthService.login();
            };

        }])

        .controller("DashboardCtrl", ["$scope", "MapService", "currentAuth", "Auth", "DataService","$rootScope", function ($scope, MapService, currentAuth, Auth, DataService, $rootScope) {
            
            // Initializa Google map
            MapService.initialize();

            $scope.initSearch = function (query, inputSearch) {
                // Remove any previous markers from the map
                if ($rootScope.markers.length > 0) {
                    $rootScope.markers.forEach(function (marker) {
                        marker.setMap(null);
                    });
                    $rootScope.markers = [];
                }
                MapService.search(query).then(function (results, status) {
                    MapService.initMarkers(results);
                    // Save query only if searched using input box
                    if(inputSearch){
                      DataService.saveSearch(query, currentAuth.uid);  
                    }                    
                });
            };
            
            // Logout current user
            $scope.logout = function () {
                Auth.$unauth();
            };

            // Retrieve all user queries
            $scope.queries = DataService.getQueries(currentAuth.uid);

        }]);

})();
