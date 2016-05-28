(function () {
    'use strict';

angular.module('app', ['app.controllers','app.services', 'ui.router', 'firebase'])

        .run(["$rootScope", "$state","AuthService","MapService", function ($rootScope, $state, AuthService, MapService) {

            $rootScope.$on("$routeChangeError", function (event, next, previous, error) {
                // We can catch the error thrown when the $requireAuth promise is rejected
                // and redirect the user back to the home page
                if (error === "AUTH_REQUIRED") {
                    $state.path("login");
                }
            });
            
            // Get current location
            MapService.currentLocation(); 
            
            // Check authentication state        
            AuthService.state();
                                   
        }])

        .config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {

            $stateProvider
                
                .state("home", {
                    url: '/home',
                    controller: "HomeCtrl",
                    templateUrl: "templates/home.html"
                })
                
                .state('dashboard', {
                    url: '/dashboard',
                    views: {
                        "": {
                            templateUrl: "templates/dashboard.html",
                            controller: "DashboardCtrl",
                            resolve: {
                                "currentAuth": ["Auth", function (Auth) {
                                    return Auth.$requireAuth();
                                }]
                            }
                        }
                    }

                });
                
            $urlRouterProvider.otherwise('/home');


        }]);

})();
