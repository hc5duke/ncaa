sixteenApp = angular.module('sixteenApp', [])

sixteenApp.controller 'SixteenCtrl', ($scope, $http) ->
  $http.get('/data.json').
  then (body) ->
    console.log(body)
    $scope.phones = body.data

console.log('test')
