angular.module('starter.filters', [])

.filter('nl2br', ['$filter',
  function($filter) {
    return function(data) {
      if (!data) return data;
      return data.replace(/\n\r?/g, '<br />');
    };
  }
])

.filter('uid2img', ['$filter','FirebaseRef',
  function($filter, FirebaseRef) {
    return function(data) {
        FirebaseRef.child('users').child(data).once('value',function(child){
            var val= child.val();
            if(val.hasOwnProperty(val.provider)){
                return val[val.provider].profileImageURL;
            }
            return 'img/anonym.jpg';
        });
    };
  }
]);