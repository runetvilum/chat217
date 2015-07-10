angular.module('starter.controllers', [])

.controller('loginCtrl', function ($scope, FirebaseRef, Auth, $http) {
    $scope.signInFacebook = function () {
        Auth.$authWithOAuthPopup("facebook").then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
            $scope.error = error;
        });
    };
    $scope.signInTwitter = function () {
        Auth.$authWithOAuthPopup("twitter").then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
            $scope.error = error;
        });
    };
    $scope.signInGoogle = function () {
        Auth.$authWithOAuthPopup("google").then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
            $scope.error = error;
        });
    };
    $scope.signInAnonymously = function () {
        Auth.$authAnonymously().then(function (authData) {
            console.log("Authentication succes:", authData.uid);
        }).catch(function (error) {
            console.error("Authentication failed:", error);
            $scope.error = error;
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
    $scope.signIn = function (user) {
        $http.post('http://bykongen.addin.dk/_chat217', user).then(function (res) {
            Auth.$authWithCustomToken(res.data).then(function (authData) {
                console.log("Authentication succes:", authData.uid);
            }).catch(function (error) {
                console.error("Authentication failed:", error);
                $scope.error = error;
            });
        }).catch(function (error) {
            console.error("Authentication failed:", error);
            $scope.error = "Brugernavn og password er ikke korrekt";
        });
    };
})

.controller('beskederCtrl', function ($scope, FirebaseRef, Auth, currentAuth) {
    // create a connection to Firebase
    $scope.Auth = Auth;
    var baseRef = FirebaseRef.child('sagsbehandler');

    // create a scrollable reference
    var scrollRef = baseRef.limitToFirst(10);
    var last, current;
    $scope.items = [];
    var getUser = function (val) {
        FirebaseRef.child('users').child(val.uid).once('value', function (child) {
            var val2 = child.val();
            if (val2.hasOwnProperty(val2.provider)) {
                val.avatar = val2[val2.provider].profileImageURL;
                val.name = val2[val2.provider].displayName;
            } else {
                val.avatar = 'img/anonym.jpg';
                val.name = 'Anonym'
            }
            $scope.$apply();
        });
    };
    scrollRef.once('value', function (child) {
        if (child.hasChildren()) {
            child.forEach(function (item) {
                var key = item.key();

                baseRef.orderByKey().startAt(key).on('child_added', function (child) {
                    console.log('ny');
                    var newkey = child.key();
                    if (key != newkey) {
                        var val = child.val();
                        $scope.items.unshift(val);
                        $scope.$apply();
                        getUser(val);
                    }
                });
                return true;
            });
            child.forEach(function (item) {
                var val = item.val();
                last = item.key();
                $scope.items.push(val);
                $scope.$apply();
                getUser(val);
            });
        } else {
            baseRef.on('child_added', function (child) {
                var val = child.val();
                getUser(val);
                $scope.items.unshift(val);
                $scope.$apply();
            });
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');

    }, function (err) {
        baseRef.on('child_added', function (child) {
            var val = child.val();
            getUser(val);
            $scope.items.unshift(val);
            $scope.$apply();
        });
    });


    // This function is called whenever the user reaches the bottom
    $scope.loadMore = function () {
        if (last && last !== current) {
            current = last;
            var next = baseRef.orderByKey().endAt(last).limitToLast(11);
            next.on('value', function (child) {
                console.log("loadmore data");
                var items = child.val();
                delete items[last];
                for (var key in items) {
                    last = key;
                    var val = items[key];
                    getUser(val);
                    $scope.items.push(val);
                }
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });

        }
        console.log("loadmore");

    };

})

/*.controller('ChatsCtrl', function ($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
        Chats.remove(chat);
    }
})*/


.controller('chatCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$ionicActionSheet', '$ionicScrollDelegate', '$timeout', 'FirebaseRef', '$firebaseArray', 'currentAuth', 'Auth', '$ionicNavBarDelegate',
  function ($scope, $rootScope, $state, $stateParams, $ionicActionSheet, $ionicScrollDelegate, $timeout, FirebaseRef, $firebaseArray, currentAuth, Auth, $ionicNavBarDelegate) {
        $scope.Auth = Auth;
        var queue = FirebaseRef.child('queue/tasks');
        var chatroomRef;
        if (currentAuth.provider !== 'custom') {
            $ionicNavBarDelegate.showBackButton(false);
            $scope.borger = currentAuth;
        } else {
            FirebaseRef.child('users').child($stateParams.user).once('value', function (child) {
                $scope.borger = child.val();
                $scope.$apply();
            });

            $ionicNavBarDelegate.showBackButton(true);
        }

        chatroomRef = FirebaseRef.child('chatroom').child($stateParams.user);



        $scope.messages = [];
        chatroomRef.on('child_added', function (child) {
            var val = child.val();
            if (val.img) {
                var img = new Image();
                img.onload = function () {
                    $scope.messages.push({
                        img: val.img,
                        uid: val.uid,
                        timestamp: val.timestamp,
                        style: {
                            height: img.height + 'px',
                            width: img.width + 'px'
                        }
                    });
                    $scope.$apply();
                    viewScroll.scrollBottom(true);
                };
                img.src = val.img;
            } else {
                $scope.messages.push(val);
                $scope.$apply();
                viewScroll.scrollBottom(true);
            }
        });

        var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
        var footerBar; // gets set in $ionicView.enter
        var scroller;
        var txtInput; // ^^^

        $scope.$on('$ionicView.enter', function () {
            console.log('UserMessages $ionicView.enter');

            //getMessages();

            $timeout(function () {
                footerBar = document.body.querySelector('#userMessagesView .bar-footer');
                scroller = document.body.querySelector('#userMessagesView .scroll-content');
                txtInput = angular.element(footerBar.querySelector('textarea'));
            }, 0);

        });


        $scope.sendMessage = function () {


            // if you do a web service call this will be needed as well as before the viewScroll calls
            // you can't see the effect of this in the browser it needs to be used on a real device
            // for some reason the one time blur event is not firing in the browser but does on devices
            //keepKeyboardOpen();



            queue.push({
                chat: {
                    msg: $scope.input.message,
                    uid: currentAuth.uid,
                    room: $stateParams.user
                }
            }, function (err) {
                if (err) {
                    console.log(err);
                }
            });

            $scope.input.message = '';
            $timeout(function () {
                //keepKeyboardOpen();

            }, 0);

        };

        // this keeps the keyboard open on a device only after sending a message, it is non obtrusive
        function keepKeyboardOpen() {
            console.log('keepKeyboardOpen');
            txtInput.one('blur', function () {
                console.log('textarea blur, focus back on it');
                txtInput[0].focus();
            });
        }

        // I emit this event from the monospaced.elastic directive, read line 480
        $scope.$on('taResize', function (e, ta) {
            console.log('taResize');
            if (!ta) return;

            var taHeight = ta[0].offsetHeight;
            console.log('taHeight: ' + taHeight);

            if (!footerBar) return;

            var newFooterHeight = taHeight + 10;
            newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

            footerBar.style.height = newFooterHeight + 'px';
            scroller.style.bottom = newFooterHeight + 'px';
        });
        $scope.openFileDialog = function () {
            if (window.cordova) {
                var hideSheet = $ionicActionSheet.show({
                    titleText: 'Vælg foto',
                    buttons: [
                        {
                            text: 'Kamera'
                    },
                        {
                            text: 'Album'
                    },
                ],
                    cancelText: 'Annuller',
                    cancel: function () {
                        console.log('CANCELLED');
                    },
                    buttonClicked: function (index) {
                        //hideSheet();
                        var options = {
                            quality: 50,
                            destinationType: navigator.camera.DestinationType.DATA_URL,
                            sourceType: navigator.camera.PictureSourceType.CAMERA,
                            correctOrientation: true
                        };
                        if (index === 1) {
                            options.sourceType = navigator.camera.PictureSourceType.PHOTOLIBRARY;

                        }

                        function onSuccess(imageData) {
                            var img = new Image();
                            img.onload = function () {
                                var canvas = document.createElement('canvas');

                                var MAX_WIDTH = 480;
                                var width = img.width;
                                var height = img.height;
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                                canvas.width = width;
                                canvas.height = height;
                                var ctx = canvas.getContext("2d");
                                ctx.drawImage(img, 0, 0, width, height);
                                queue.push({
                                    chat: {
                                        img: canvas.toDataURL('image/jpeg'),
                                        uid: currentAuth.uid,
                                        room: $stateParams.user
                                    }
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });

                            };
                            img.src = "data:image/jpeg;base64," + imageData;
                        }

                        function onFail(message) {
                            alert('Failed because: ' + message);
                        }
                        navigator.camera.getPicture(onSuccess, onFail, options);
                        return true;
                    }
                });
            } else {
                var file = window.document.getElementById("image");
                angular.element(file).one('change', function (event) {
                    var file = event.target.files[0];
                    var fileReader = new window.FileReader();
                    fileReader.readAsDataURL(file);
                    fileReader.onload = function (e) {
                        var img = new Image();
                        img.onload = function () {
                            var canvas = document.createElement('canvas');
                            var MAX_WIDTH = 480;
                            var width = img.width;
                            var height = img.height;
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0, width, height);
                            queue.push({
                                chat: {
                                    img: canvas.toDataURL('image/jpeg'),
                                    uid: currentAuth.uid,
                                    room: $stateParams.user
                                }
                            }, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });

                        };
                        img.src = e.target.result;
                    };
                });
                ionic.trigger('click', {
                    target: file
                });
            }

        };

}])

.controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function ($scope, currentAuth, Auth) {
    if (currentAuth.hasOwnProperty(currentAuth.provider) && currentAuth[currentAuth.provider].displayName) {
        $scope.name = currentAuth[currentAuth.provider].displayName;
    } else if (currentAuth.auth.sagsbehandler) {
        $scope.name = 'Sagsbehandler';
    } else {
        $scope.name = 'Anonym';
    }
    $scope.logout = function () {
        Auth.$unauth();
    };
});