'use strict';

var datas_Services = angular.module('mServices', []);

datas_Services.factory('mServices', function($http) {
	return {
		'ajaxToSport': $http({ method: 'GET',type: 'json', url: './assets/_json/sport.json' })
	}
});