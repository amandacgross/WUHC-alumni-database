var app = angular.module('angularjsNodejsTutorial',[]);

app.controller('loginController', function($scope, $http, $window) {
        $scope.Init = function() {
            console.log('hi');
        };
        $scope.Signin = function() {

            var data = {
                 //email: $scope.email,
                 password: $scope.password
            };

            //var request = $http.post('/signin', data);
            var request = $http.post('/checkPassword', data);
            request.success(function(data) {
               // if(data == true){
                if(data){
                    $scope.mg = 'sign in successful';
                    console.log('login success');
                    $window.location.href = '/menu?user='+$scope.email;

                }else{
                    $scope.mg = 'Incorrect username or password! Please click sign up if you are a new user';
                    console.log('incorrect login');
                }


            });
            request.error(function(data){
                console.log('err in signin call');
            });

        };

        $scope.Signup = function() {

            var data = {
                 email: $scope.email,
                 password: $scope.password
            };

            var request = $http.post('/signup', data);
            request.success(function(data) {
                if(data == true){
                    $scope.mg = 'signup successful';
                    console.log('signup success');
                    $window.location.href = '/menu?user='+$scope.email;

                }else{
                    $scope.mg = 'User already exists! Please click Sign in instead.';
                    console.log('incorrect signup');
                }


            });
            request.error(function(data){
                console.log('err in signup call');
            });

        }
});

//Call this function when page loads rather than waiting for the click
app.controller('myController', function($scope, $window, $http) {
        $scope.message="";
        $scope.Submit = function() {
            var request = $http.get('/data'); 
            request.success(function(data) {
                $scope.data = data.Items;
                console.log(data.Items);
                $('#alumniTable').DataTable();
            });
            request.error(function(data){
                console.log('err');
            });
        };
        $scope.SelectProfile = function (x) {
            console.log(x);
            $window.location.href = '/profile?aid=' + x.aID;
        }; 
});

app.controller('insertController', function($scope, $http) {
     $scope.Insert = function() {
        var request = $http.get('/insert/'+$scope.login+'&'+$scope.name+'&'+$scope.sex+'&'+$scope.RelationshipStatus+'&'+$scope.Birthyear);
        request.success(function(data) {
            $scope.message = "Insertion successful!";
        });
        request.error(function(data){
            console.log('err');
        });
    };
    
});

app.controller('profileController', function($scope, $window, $http) {
    var args = location.search.split('&');
    var aid = args[0].split('aid=')[1];
    $window.onload = function () {
        var request = $http.get('/data/show/profile/' + aid);
        request.success(function(data) {
            $scope.data = data;
            $('#title').html(data.firstName + " " + data.lastName);
            $('#fname').html(data.firstName);
            $('#lname').html(data.lastName);
            $('#location').html(data.location);
            $('#descI').html(data.industry);
            $('#descCO').html(data.organization);
            $('#school').html(data.school);
            $('#year').html(data.gradYear);
        });
        request.error(function(data) {
            console.log('err');
        });
    }
	//note that the current profile info will probably be retrieved when they appear on the search page, and saved in scope variable
	$scope.SaveProfile = function () {
		//will save this profile to the user's list of saved profiles
	}
});