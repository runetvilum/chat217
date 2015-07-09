angular.module('starter.controllers', [])

.controller('DashCtrl', function ($scope, FirebaseRef) {
    // create a connection to Firebase
    var baseRef = FirebaseRef.child('sagsbehandler');
    // create a scrollable reference
    var scrollRef = baseRef.limitToFirst(10);
    var last, current;
    $scope.items = [];
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
                    }
                });
                return true;
            });
            child.forEach(function (item) {
                var val = item.val();
                last = item.key();
                $scope.items.push(val);
                $scope.$apply();
            });
        } else {
            baseRef.on('child_added', function (child) {
                var val = child.val();
                $scope.items.unshift(val);
                $scope.$apply();
            });
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');

    }, function (err) {
        baseRef.on('child_added', function (child) {
            var val = child.val();
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


.controller('ChatsCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'MockService', '$ionicActionSheet', '$ionicScrollDelegate', '$timeout', '$interval', 'FirebaseRef', '$firebaseArray', 'currentAuth',
  function ($scope, $rootScope, $state, $stateParams, MockService, $ionicActionSheet, $ionicScrollDelegate, $timeout, $interval, FirebaseRef, $firebaseArray, currentAuth) {
        var queue = FirebaseRef.child('queue/tasks');
        var chatroomRef;
        if ($stateParams.user) {
            chatroomRef = FirebaseRef.child('chatroom').child($stateParams.user);
            FirebaseRef.child('users').child($stateParams.user).once('value', function (child) {
                $scope.borger = child.val();
                $scope.$apply();
            });
        } else {
            chatroomRef = FirebaseRef.child('chatroom').child(currentAuth.uid);
            $scope.borger = currentAuth;
        }

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

            if (currentAuth.auth.sagsbehandler) {
                var priority = Date.now();
                chatroomRef.push({
                    msg: $scope.input.message,
                    uid: currentAuth.uid,
                    timestamp: priority
                }).setPriority(priority);
            } else {
                queue.push({
                    chat: {
                        msg: $scope.input.message,
                        uid: $rootScope.authData.uid
                    }
                }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
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
                                if (currentAuth.auth.sagsbehandler) {
                                    var priority = Date.now();
                                    chatroomRef.push({
                                        img: canvas.toDataURL('image/jpeg'),
                                        uid: currentAuth.uid,
                                        timestamp: priority
                                    }).setPriority(priority);
                                } else {
                                    queue.push({
                                        chat: {
                                            img: canvas.toDataURL('image/jpeg'),
                                            uid: $rootScope.authData.uid
                                        }
                                    }, function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
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
                            if (currentAuth.auth.sagsbehandler) {
                                var priority = Date.now();
                                chatroomRef.push({
                                    img: canvas.toDataURL('image/jpeg'),
                                    uid: currentAuth.uid,
                                    timestamp: priority
                                }).setPriority(priority);
                            } else {
                                queue.push({
                                    chat: {
                                        img: canvas.toDataURL('image/jpeg'),
                                        uid: $rootScope.authData.uid
                                    }
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
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