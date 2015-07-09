// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'starter.filters', 'starter.directives', 'monospaced.elastic', 'angularMoment', 'firebase'])

.run(function ($ionicPlatform, Auth, $rootScope, $ionicModal, FirebaseRef, $http, amMoment) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }
    });
    amMoment.changeLocale('da');
    Auth.$onAuth(function (authData) {
        if (authData) {
            console.log("Logged in as:", authData.uid);
            if (authData.provider !== 'custom') {
                FirebaseRef.child('users').child(authData.uid).set(authData);
            }

        } else {

            console.log("Logged out");


        }
    });
    var scope = $rootScope.$new();
    //var userRef;
    //var presenceRef = FirebaseRef.child('.info/connected');
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {

    });
    $ionicModal.fromTemplateUrl('templates/modal-login.html', {
        scope: scope,
        animation: 'slide-in-up',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
    }).then(function (modal) {
        scope.modal = modal;
        Auth.$onAuth(function (authData) {
            if (authData) {
                $rootScope.authData = authData;
                //userRef = FirebaseRef.child('presence').child(authData.uid);
                scope.modal.hide();
            } else {
                delete $rootScope.authData;
                scope.modal.show();
            }
        });
    });
    scope.signInFacebook = function () {
        Auth.$authWithOAuthPopup("facebook").then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
        });
    };
    scope.signInTwitter = function () {
        Auth.$authWithOAuthPopup("twitter").then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
        });
    };
    scope.signInGoogle = function () {
        Auth.$authWithOAuthPopup("google").then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
        });
    };
    scope.signInAnonymously = function () {
        Auth.$authAnonymously().then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
        });
    };
    /*scope.signIn = function (user) {
        Auth.$authWithPassword(user).then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
            scope.error = error.message;
        });
    };*/
    scope.signIn = function (user) {
        $http.post('http://bykongen.addin.dk:4001/signin', user).then(function (res) {
            Auth.$authWithCustomToken(res.data).then(function (authData) {
                console.log("Authentication succes:", authData.uid);
            }).catch(function (error) {
                console.error("Authentication failed:", error);
            });
        }).catch(function (error) {
            console.error("Authentication failed:", error);
            scope.error = error.message;
        });
    };
})

.config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // setup an abstract state for the tabs directive
        .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html",
    })

    // Each tab has its own nav history stack:

    .state('tab.dash', {
        url: '/dash',
        views: {
            'tab-dash': {
                templateUrl: 'templates/tab-dash.html',
                controller: 'DashCtrl',
                resolve: {
                    "currentAuth": ["Auth", function (Auth) {
                        //return Auth.$requireAuth();
                        return Auth.$waitForAuth();
                    }]
                }
            }
        }
    })

    .state('tab.chats', {
        url: '/chats?user',
        views: {
            'tab-chats': {
                templateUrl: 'templates/tab-chats.html',
                controller: 'ChatsCtrl',
                resolve: {
                    "currentAuth": ["Auth", function (Auth) {
                        //return Auth.$requireAuth();
                        return Auth.$waitForAuth();
                    }]
                }
            }
        }
    })

    .state('tab.chat-detail', {
        url: '/chats/:chatId',
        views: {
            'tab-chats': {
                templateUrl: 'templates/chat-detail.html',
                controller: 'ChatDetailCtrl'
            }
        }
    })

    .state('tab.account', {
        url: '/account',
        views: {
            'tab-account': {
                templateUrl: 'templates/tab-account.html',
                controller: 'AccountCtrl',
                resolve: {
                    "currentAuth": ["Auth", function (Auth) {
                        //return Auth.$requireAuth();
                        return Auth.$waitForAuth();
                    }]
                }
            }
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/chats');

});