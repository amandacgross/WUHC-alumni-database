var app = angular.module('angularjsNodejsTutorial',[]);

app.controller('loginController', function($scope, $http, $window) {
    $window.onload = function() {
        if (location.search.length !== 0) {
            $('#missing-values').css('display','block');
        }
    };
});

//Call this function when page loads rather than waiting for the click
app.controller('myController', function($scope, $window, $http) {
    $scope.message="";
    $scope.Submit = function() {
        var request = $http.get('/data'); 
        request.success(function(data) {
            $scope.data = data.Items;
            $.fn.dataTable.ext.errMode = 'none';
            if (data.Items[0].aID != undefined) {
                $('#alumniTable .filters th').each( function () {
                    $(this).html( '<input type="text" placeholder="" />' );
                });
                var table = $('#alumniTable').DataTable({
                    data : $scope.data,
                    rowId : "aID",
                    columns : [
                        {data: "firstName", width: "50px"},
                        {data: "lastName"},
                        {data: "industry"},
                        {data: "organization"},
                        {data: "position"},
                        {data: "location"},
                        {data: "gradYear"},
                        {data: "school"},
                        {data: "major"},
                        {data: "isMember"},
                        {data: "interests"}
                    ]
                });
                $('#alumniTable tbody').on('click', 'tr', function () {
                    var id = table.row(this).id();
                    $window.location.href = '/alumnusProfile?id=' + id;
                });
            } else {
                $('#alumniTable thead th').each( function () {
                    if ($(this).hasClass("alum")){
                        $(this).remove();
                    }
                });
                $('#alumniTable .filters th').each( function () {
                    $(this).html( '<input type="text" placeholder="" />' );
                });
                var table = $('#alumniTable').DataTable({
                    data : $scope.data,
                    rowId : "sID",
                    columns : [
                        {data: "firstName", width: "50px"},
                        {data: "lastName"},
                        {data: "gradYear"},
                        {data: "school"},
                        {data: "major"},
                        {data: "isMember"},
                        {data: "interests"}
                    ]
                });
                $('#alumniTable tbody').on('click', 'tr', function () {
                    var id = table.row(this).id();
                    $window.location.href = '/studentProfile?id=' + id;
                });
            }   
            // Apply the categorical search
            table.columns().every( function (colId) {
                $( 'input', $('.filters th')[colId] ).on('keyup change', function () {
                    table
                        .column( colId )
                        .search( this.value )
                        .draw();
                });
            });
            $('#alumniTable').width(100);

        });

        request.error(function(data){
            console.log('err');
        });
    };
});

app.controller('createAlumController', function($scope, $window, $http) {
    $window.onload = function () {
        var request = $http.get('/data/show/credentials');
        request.success(function(data) {
            $scope.accessKeyId = data.accessKeyId;
            $scope.secretAccessKey = data.secretAccessKey;
        });
        request.error(function(data) {
            console.log('err');
        });
        var yearsDD = $('#year');
        var d = new Date();
        var currentYear = d.getFullYear();
        var i = 0;
        if(d.getMonth() < 4) {
          i = 1;
        }
        for(i; i<100; i++) {
            var yr = currentYear - i;
            var opt = $("<option>"+yr+"</option>").val(yr);
            yearsDD.append(opt);
        }
    };

    $scope.upload = function() {
        if ($('#fname').val().length === 0 || $('#lname').val().length === 0 || $('#position').val().length === 0
            || $('#email').val().length === 0 || $('#year').val().length === 0
            || $("input:checked").length === 0 || $('#industry').val().length === 0
            || $('#organization').val().length === 0 || $('#location').val().length === 0
            || $('#password').val().length === 0 || $('#file').get(0).files.length === 0) 
        {
            $('#missing-values').css('display','block');
        } else {
            AWS.config.update({accessKeyId: $scope.accessKeyId, secretAccessKey: $scope.secretAccessKey,
             region: "us-east-1"});
            var s3 = new AWS.S3({
                params: {Bucket: "wuhc"}
            });
            var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
            
            var aID = Math.random()*1234325252;
            var photoFile = document.getElementById('file').files[0];
            s3.upload({
                Key: aID.toString(),
                Body: photoFile,
                ACL: 'public-read'
            }, function(err, data) {
                if (err) {
                    console.log(err.message);
                } else {
                    // console.log('Successfully uploaded photo.');
                    // console.log(data.Location);
                    var schools = "";
                    if ($('#w').prop('checked')) {
                        schools = schools + " Wharton,";
                    }
                    if ($('#cas').prop('checked')) {
                        schools = schools + " College of Arts and Sciences,";
                    }
                    if ($('#n').prop('checked')) {
                        schools = schools + " Nursing,";
                    }
                    if ($('#e').prop('checked')) {
                        schools = schools + " Engineering,";
                    }
                    schools = schools.substring(1, schools.length-1);
                    var item = {
                        'aID' : {N: ''+aID},
                        'firstName' : {S: $('#fname').val()},
                        'gradYear' : {S: $('#year').val()},
                        'industry' : {S: $('#industry').val()},
                        'isMember' : {S: $('#member').val()},
                        'lastName' : {S: $('#lname').val()},
                        'location' : {S: $('#location').val()},
                        'major' : {S: $('#major').val()},
                        'organization' : {S: $('#organization').val()},
                        'position' : {S: $('#position').val()},
                        'school' : {S: schools},
                        'photo' : {S: data.Location},
                        'email' : {S: $('#email').val()}
                    };
                    if ($('#interests').val() != "") {
                        item.interests = {S: $('#interests').val()};
                    }
                    var params = {
                        TableName: 'Alumni',
                        Item: item
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
                                    $('#return-btn').css("display","block");
                                    $window.scrollTo(0, 0);
                                }
                            });
                        }
                    });
                }
            });
        }
    };

    $scope.return = function() {
        $window.location.href = '/';
    };
});

app.controller('createStuController', function($scope, $window, $http) {
    $window.onload = function () {
        var request = $http.get('/data/show/credentials');
        request.success(function(data) {
            $scope.accessKeyId = data.accessKeyId;
            $scope.secretAccessKey = data.secretAccessKey;
        });
        request.error(function(data) {
            console.log('err');
        });
        var yearsDD = $('#year');
        var d = new Date();
        var currentYear = d.getFullYear();
        var i = 0;
        if(d.getMonth() > 5) {
            i = 1;
        }
        for(var j=0; j<4; j++) {
            var yr = currentYear + i;
            var opt = $("<option>"+yr+"</option>").val(yr);
            yearsDD.append(opt);
            i++;
        }
    };

    $scope.upload = function() {
        if($('#fname').val().length === 0 || $('#lname').val().length === 0 || $('#email').val().length === 0 
          || $('#year').val().length === 0 || $("input:checked").length === 0 || $('#password').val().length === 0 
          || $('#file').get(0).files.length === 0) 
        {
            $('#missing-values').css('display','block');
        } else {
            AWS.config.update({accessKeyId: $scope.accessKeyId, secretAccessKey: $scope.secretAccessKey,
             region: "us-east-1"});
            var s3 = new AWS.S3({
                params: {Bucket: "wuhc"}
            });
            var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

            var sID = Math.random()*1234325252;
            var photoFile = document.getElementById('file').files[0];
            s3.upload({
                Key: sID.toString(),
                Body: photoFile,
                ACL: 'public-read'
            }, function(err, data) {
                if (err) {
                    console.log(err.message);
                } else {
                    // console.log('Successfully uploaded photo.');
                    // console.log(data.Location);
                    var schools = "";
                    if ($('#w').prop('checked')) {
                        schools = schools + " Wharton,";
                    }
                    if ($('#cas').prop('checked')) {
                        schools = schools + " College of Arts and Sciences,";
                    }
                    if ($('#n').prop('checked')) {
                        schools = schools + " Nursing,";
                    }
                    if ($('#e').prop('checked')) {
                        schools = schools + " Engineering,";
                    }
                    schools = schools.substring(1, schools.length-1);
                    var item = {
                        'sID' : {N: ''+sID},
                        'firstName' : {S: $('#fname').val()},
                        'gradYear' : {S: $('#year').val()},
                        'isMember' : {S: $('#member').val()},
                        'lastName' : {S: $('#lname').val()},
                        'major' : {S: $('#major').val()},
                        'school' : {S: schools},
                        'photo' : {S: data.Location},
                        'email' : {S: $('#email').val()}
                    };
                    if ($('#interests').val() != "") {
                        item.interests = {S: $('#interests').val()};
                    }
                    var params = {
                        TableName: 'Students',
                        Item: item
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
                                    $('#return-btn').css("display","block");
                                    $window.scrollTo(0, 0);
                                }
                            });
                        }
                    });
                }
            });
        }
    };

    $scope.return = function() {
        $window.location.href = '/';
    };
});

app.controller('profileController', function($scope, $window, $http) {
    var args = location.search.split('&');
    var id = args[0].split('id=')[1];
    $window.onload = function () {
        var request = $http.get('/data/show/profile/' + id);
        request.success(function(data) {
            $scope.data = data;
            $('#name').html(data.firstName + " " + data.lastName);
            $('#fname').html(data.firstName);
            $('#lname').html(data.lastName);
            $('#location').html(data.location);
            $('#descI').html(data.industry);
            $('#descCO').html(data.organization);
            $('#position').html(data.position);
            $('#school').html(data.school);
            $('#year').html(data.gradYear);
            $('#email').html(data.email);
            $('#photo').attr('src', data.photo);
            $('#interests').html("My interests: " + data.interests);
            $('#major').html(data.major);
            if(data.interests == undefined){
                $('#ints').remove();
            }
        });
        request.error(function(data) {
            console.log('err');
        });
    }
});