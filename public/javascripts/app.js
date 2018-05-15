var app = angular.module('angularjsNodejsTutorial',[]);

app.controller('loginController', function($scope, $http, $window) {
        $scope.Init = function() {
            console.log('hi');
        };
        $scope.Signin = function() {

            var data = {
                 username: $scope.username,
                 password: $scope.password
            };

            //var request = $http.post('/signin', data);
            var request = $http.post('/checkPassword', data);
            request.success(function(data) {
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
                $('#alumniTable thead th').each( function () {
                    var title = $(this).text();
                    $(this).html( '<input type="text" placeholder="'+title+'" />' );
                } );
                var table = $('#alumniTable').DataTable({
                    data : $scope.data,
                    rowId : "aID",
                   // autoWidth : false,

                    columns : [
                        {data: "firstName", width: "50px"},
                        {data: "lastName"},
                        {data: "industry"},
                        {data: "location"},
                        {data: "organization"},
                        {data: "gradYear"},
                        {data: "school"}
                    ]
                });
                // Apply the search
                table.columns().every( function () {
                    var that = this;
                    $( 'input', this.header() ).on( 'keyup change', function () {
                        if ( that.search() !== this.value ) {
                            that
                            .search( this.value )
                            .draw();
                        }
                    } );
                } );
                $('#alumniTable tbody').on('click', 'tr', function () {
                	var aid = table.row(this).id();
                	$window.location.href = '/profile?aid=' + aid;
                });
                 $('#alumniTable').width(100);

            });
            request.error(function(data){
                console.log('err');
            });
        };
});

app.controller('insertController', function($scope, $window, $http) {
    $window.onload = function () {
        var request = $http.get('/data/show/credentials');
        request.success(function(data) {
            $scope.accessKeyId = data.accessKeyId;
            $scope.secretAccessKey = data.secretAccessKey;
        });
        request.error(function(data) {
            console.log('err');
        });
    };
     $scope.upload = function() {
        AWS.config.update({accessKeyId: $scope.accessKeyId, secretAccessKey: $scope.secretAccessKey,
         region: "us-east-1"});
        var s3 = new AWS.S3({
            params: {Bucket: "wuhc"}
        });
        var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
        console.log('hello');
        var photoFile = document.getElementById('file').files[0];
        console.log(photoFile);
        s3.upload({
            Key: photoFile.name,
            Body: photoFile,
            ACL: 'public-read'
        }, function(err, data) {
            if (err) {
                console.log(err.message);
            } else {
                console.log('Successfully uploaded photo.');
                console.log(data.Location);
                var aID = Math.random()*1234325252;
                var params = {
                  TableName: 'Alumni',
                  Item: {
                    'aID' : {N: ''+aID},
                    'firstName' : {S: $('#fname').val()},
                    'gradYear' : {S: $('#year').val()},
                    'industry' : {S: $('#industry').val()},
                    'lastName' : {S: $('#lname').val()},
                    'location' : {S: $('#location').val()},
                    'organization' : {S: $('#organization').val()},
                    'school' : {S: $('#school').val()},
                    'photo' : {S: data.Location},
                    'email' : {S: $('#email').val()}
                  }
                };

                ddb.putItem(params, function(err, data) {
                  if (err) {
                    console.log("Error", err);
                  } else {
                    console.log("Success", data);
                    params = {
                      TableName: 'UserAccount',
                      Item: {
                        'password' : {S: $('#password').val()},
                        'firstName' : {S: $('#fname').val()},
                        'lastName' : {S: $('#lname').val()},
                        'email' : {S: $('#email').val()}
                      }
                    };
                    ddb.putItem(params, function(err, data) {
                      if (err) {
                        console.log("Error", err);
                      } else {
                        console.log("Success", data);
                        $('#alumniForm').css("display","none");
                        $('#submit-btn').css("display","none");
                        $('#text1').html("Signup was successful");
                        $('#return-btn').css("display","inline");
                        $window.scrollTo(0, 0);
                      }
                    });
                  }
                });
            }
        });
    };

    $scope.return = function() {
        $window.location.href = '/';
    };
    
});

app.controller('profileController', function($scope, $window, $http) {
    var args = location.search.split('&');
    var aid = args[0].split('aid=')[1];
    $window.onload = function () {
        var request = $http.get('/data/show/profile/' + aid);
        request.success(function(data) {
            $scope.data = data;
            $('#name').html(data.firstName + " " + data.lastName);
            $('#fname').html(data.firstName);
            $('#lname').html(data.lastName);
            $('#location').html(data.location);
            $('#descI').html(data.industry);
            $('#descCO').html(data.organization);
            $('#school').html(data.school);
            $('#year').html(data.gradYear);
            $('#email').html(data.email);
            $('#photo').attr('src', data.photo);
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