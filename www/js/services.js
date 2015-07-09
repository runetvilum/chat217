angular.module('starter.services', [])

.factory("FirebaseRef", function () {
    var ref = new Firebase("https://chat217.firebaseio.com");
    return ref;
})

.factory("Auth", ["$firebaseAuth", "FirebaseRef",
  function ($firebaseAuth, FirebaseRef) {
        return $firebaseAuth(FirebaseRef);
  }
])

/*.factory('PresenceService', ['$rootScope', 'FirebaseRef',
  function ($rootScope, FirebaseRef) {
        var onlineUsers = 0;

        // Create our references
        var listRef = FirebaseRef.child('presence');
        var userRef = listRef.push(); // This creates a unique reference for each user
        var presenceRef = FirebaseRef.child('.info/connected');

        // Add ourselves to presence list when online.
        presenceRef.on('value', function (snap) {
            if (snap.val()) {
                userRef.set('★ online');
                userRef.onDisconnect().set('☆ offline');
            }
        });

        // Get the user count and notify the application
        listRef.on('value', function (snap) {
            onlineUsers = snap.numChildren();
            $rootScope.$broadcast('onOnlineUser');
        });
        document.onIdle = function () {
            userRef.set('☆ idle');
        }
        document.onAway = function () {
            userRef.set('☄ away');
        }
        document.onBack = function (isIdle, isAway) {
            userRef.set('★ online');
        }

        var getOnlineUserCount = function () {
            return onlineUsers;
        }

        return {
            getOnlineUserCount: getOnlineUserCount
        }
  }
])*/

.factory('Chats', function () {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var chats = [{
        id: 0,
        name: 'Ben Sparrow',
        lastText: 'You on your way?',
        face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
        id: 1,
        name: 'Max Lynx',
        lastText: 'Hey, it\'s me',
        face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
        id: 2,
        name: 'Adam Bradleyson',
        lastText: 'I should buy a boat',
        face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
        id: 3,
        name: 'Perry Governor',
        lastText: 'Look at my mukluks!',
        face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
  }, {
        id: 4,
        name: 'Mike Harrington',
        lastText: 'This is wicked good ice cream.',
        face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

    return {
        all: function () {
            return chats;
        },
        remove: function (chat) {
            chats.splice(chats.indexOf(chat), 1);
        },
        get: function (chatId) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].id === parseInt(chatId)) {
                    return chats[i];
                }
            }
            return null;
        }
    };
})

.factory('MockService', ['$http', '$q',
  function ($http, $q) {
        var me = {};

        me.getUserMessages = function (d) {
            /*
            var endpoint =
              'http://www.mocky.io/v2/547cf341501c337f0c9a63fd?callback=JSON_CALLBACK';
            return $http.jsonp(endpoint).then(function(response) {
              return response.data;
            }, function(err) {
              console.log('get user messages error, err: ' + JSON.stringify(
                err, null, 2));
            });
            */
            var deferred = $q.defer();

            setTimeout(function () {
                deferred.resolve(getMockMessages());
            }, 1500);

            return deferred.promise;
        };

        me.getMockMessage = function () {
            return {
                userId: '534b8e5aaa5e7afc1b23e69b',
                date: new Date(),
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
            };
        }

        return me;
  }
]);