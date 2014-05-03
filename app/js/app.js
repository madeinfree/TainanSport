/* Author: Whien 
   FaceBook: sal95610@yahoo.com.tw
   Email: sal95610@gmail.com
   Update: 2014 - 04 - 27 
*/
'use strict';

var sportApp = angular.module('SportApp', ['ngRoute','ui.bootstrap','mServices','ezfb', 'firebase']);

//RouteBind,FB Bind
sportApp
.config(function($routeProvider, ezfbProvider) {
	$routeProvider
		.when('/', {
			controller: 'showAction',
			templateUrl: './app/views/showPage.html'
		})
		.when('/detail/:SportAppId', {
			controller: 'detailAction',
			templateUrl: './app/views/detail.html'
		})
		.when('/nowSport', {
			controller: 'nowAction',
			templateUrl: './app/views/nowPage.html'
		})
		.otherwise({
			redirectTo: '/'
		});
		ezfbProvider.setInitParams({
			appId: '1406993952911833'
		});
});

sportApp.factory('SliceData', function() {
	
	return {
		get: function(datas, offset, limit) {
			return datas.slice( offset, offset+limit );
		}
	};
});

sportApp.factory('FaceBookApi', function(ezfb) {
	
	return {
		LoginFB: function() {
			return ezfb.login(null, {scope: 'email,user_likes'});
		},
		LogoutFB: function() {
			return ezfb.logout();
		},
		getLoginStatuser: function() {
			return ezfb.getLoginStatus();
		},
		getApiCallBack: function(query) {
			return ezfb.api(query);
		}
	};

});

sportApp.factory('helperApi', function() {
	return {
		generateGuid: function() {
		  var result, i, j;
		  result = '';
		  for(j=0; j<32; j++) {
		    if( j == 8 || j == 12|| j == 16|| j == 20) 
		      result = result + '-';
		    i = Math.floor(Math.random()*16).toString(16).toUpperCase();
		    result = result + i;
		  }
		  return result;
		}
	}
});

sportApp.factory('FirebaseApi', function($firebase) {

	return {
		getFireBase: function() {
			//getFirebase
			return $firebase(new Firebase("https://golikesport.firebaseio.com/"));
		}
	}

});

sportApp.controller('MainCtrl', function($scope, FaceBookApi, ezfb) {


	FaceBookApi.getLoginStatuser().then(function(res) {
		if(res.status === 'connected') {
			$scope.connect = true;
		} else {
			$scope.connect = false;
		}
	});
	$scope.loginFB = function() {
		FaceBookApi.LoginFB().then(function() {
			FaceBookApi.getLoginStatuser().then(function(res) {
				if(res.status === 'connected') {
					$scope.connect = true;
				}
			});
		});
	};

	$scope.logoutFB = function() {
		FaceBookApi.LogoutFB();
		$scope.connect = false;
	}

});

sportApp.controller('showAction', function($scope, $rootScope, $http, $filter, $location, SliceData, mServices, ezfb) {

	//Service Ajax Get Data
	var servicesDatas = mServices.ajaxToSport;
	servicesDatas.success(function(data) {
			setPaginationCallBack(data);
			$scope.setPage();
	}).
	error(function(data) {

	});

	//Pagination
	function setPaginationCallBack(data) {
	 $scope.len = data.length;
	 $scope.old_datas = data;
	 $scope.datas_searchResult = $scope.old_datas || [];
	 $scope.datas = [];
		
	 $scope.noOfPages = Math.ceil($scope.len / 10);

	 $scope.setPage();
	 $scope.maxSize = 20;
	 $scope.bigTotalItems = $scope.len;
	 $scope.numPerPage = 10;
	 $scope.bigCurrentPage = 1;

	 $scope.$watch( 'search', function ( query ) {
	  $scope.filteredData = $filter("filter")($scope.old_datas, query);
	  $scope.bigTotalItems = $scope.filteredData.length;
	  $scope.datas_searchResult = $scope.filteredData;
	  $scope.bigCurrentPage = 1;
	  $scope.setPage();
   });

	}

	//Helper
	$scope.setPage = function () {
		$scope.datas = SliceData.get( $scope.datas_searchResult, ($scope.bigCurrentPage - 1) * $scope.numPerPage, $scope.numPerPage );
	};
	
	$scope.dataDetail = function() {
		var url = (this.data.column[2]['#text']);
		$location.url('detail/' + url);
	}

	});

	sportApp.controller('detailAction', function($scope, $location, $interval, FirebaseApi, SliceData, mServices, FaceBookApi, ezfb, helperApi) {

		//getFirebase
		$scope.getSportFromFirebase = FirebaseApi.getFireBase();

		//FaceBook
		$interval(function() {
			FaceBookApi.getLoginStatuser().then(function(res) {
				if(res.status === 'connected') {
					//Console Tips
					//console.log('FaceBook is connected !!');
					//
					//Trun connect -> true
					$scope.connect = true;

					FaceBookApi.getApiCallBack('/me')
					.then(function (me) {
						$scope['myName'] = me.name;
						$scope['myId'] = me.id;
						$scope['myMail'] = me.email;
		    	});
				} else {
					$scope.connect = false;
				}
			});
		},500);
		  
	  //detail name save
		$scope.detail_name = $location.path().split('/')[2];
		//ImageSlider
	  $scope.myInterval = 5000;
	  var slides = $scope.slides = [];
	  $scope.addSlide = function() {
	    var newWidth = 600 + slides.length;
	    slides.push({
	      image: 'http://placekitten.com/' + newWidth + '/550',
	      text: ['More','Extra','Lots of','Surplus'][slides.length % 4] + ' ' +
	        ['Cats', 'Kittys', 'Felines', 'Cutes'][slides.length % 4]
	    });
	  };
	  for (var i=0; i<4; i++) {
	    $scope.addSlide();
	  }

	  //ImageSlider
	  var ajaxToSport = mServices.ajaxToSport;
	  ajaxToSport.success( function(data) {
	  	//Show details
	  	for(var i = 0, lng = data.length; i < lng; i++) {
	  		if($scope.ObjectToArray(data)[i].column[2]['#text'].indexOf($location.path().split('/')[2]) != -1) {
	  			$scope.showDetail(data, i);
	  			break;
	  		}	
	  	}
	  });

	  $scope.showDetail = function(datas, detail_name) {
	  	
	  	var ArrayParam = {
	  		t: '#text'
	  	};

	  	var publicColumn = datas[detail_name].column;

	  	var details = {
	  		'name': publicColumn[2][ArrayParam.t],
	  		'address': publicColumn[4][ArrayParam.t],
	  		'mapLon': publicColumn[8][ArrayParam.t],
	  		'mapLat': publicColumn[9][ArrayParam.t],
	  		'phone': publicColumn[11][ArrayParam.t],
	  		'time': publicColumn[15][ArrayParam.t]
	  	}

	  	$scope.saveDetails = details;

	  }

	  //增加揪團
	  $scope.addGroupFn = function() {
	  	$scope.addGroupSport = !$scope.addGroupSport;
	  }

	  //送出表單
	  $scope.sendPost = function() {
	  	if(!$scope.connect) {
	  		alert('請先登入FaceBook');
	  	} else {
	  		$scope.saveDetails['myName'] = $scope['myName'];
	  		$scope.saveDetails['myId'] = $scope['myId'];
	  		$scope.saveDetails['myMail'] = $scope['myMail'];
	  		$scope.saveDetails['content'] = $scope.myContent;
	  		$scope.saveDetails['Audit'] = 0;
	  		$scope.saveDetails['uuid'] = helperApi.generateGuid();
	  		$scope.getSportFromFirebase.$add($scope.saveDetails);
	  		alert('活動已送出，請等待審核。');
	  	}
	  }

	  //Helper
	  $scope.ObjectToArray = function(data) {
	  	return Array.prototype.slice.call(data);
	  }

	});

	sportApp.controller('nowAction', ['$scope','FirebaseApi', function(scope, firebase) {
		var fireService = firebase.getFireBase();
		scope.nowDatas = fireService;
	}]);