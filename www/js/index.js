var apiUrl = "https://bcnbikeanchors.azure-mobile.net/api/bikeanchors";
var map = null;
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.addClickListeners();
        console.log("device ready");
        map = new google.maps.Map(document.getElementById('map-canvas'), {zoom:12, center: new google.maps.LatLng(41.3906611,2.171749)});
        navigator.geolocation.getCurrentPosition(app.onSuccess, app.onError);
    },

    onSuccess: function(position) {

        var lat = position.coords.latitude;
        var lng = position.coords.longitude;

        var icon = { path: google.maps.SymbolPath.CIRCLE, scale: 5};

        mapHelper.setMarker(lat, lng, icon);

        mapHelper.navigateToPoint(lat,lng);

        $.ajax({
            type: "GET",
            headers: {"X-ZUMO-APPLICATION": "UmlmPXSgHQmFpGlfnjDBUnFbofUqqs65"},
            url: apiUrl + "?lat=" + lat + "&lng=" + lng
        }).done(app.onLocatedDataLoaded);   
                
    },
    onError: function() {
        alert(  'code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
    }, 
    onLocatedDataLoaded: function(data){
        //will only run when we've got the user's position and internet.
        $('#floating-closest-anchor').text(data[0].name);

        for(var i=0;i<data.length;i++){
            mapHelper.setMarker(data[i].latitude,data[i].longitude);
        }
    },
    addClickListeners: function(){
        $('#addallmarkers').click(function(){
            alert("add all markers");
        });
    }

};

var mapHelper = {
    navigateToPoint: function(lat,lng){
        var latlng = new google.maps.LatLng(lat,lng);
        map.panTo(latlng);
        map.setZoom(15);
    },
    setMarker: function(lat,lng,markerIcon){
        var latlng = new google.maps.LatLng(lat,lng);
        var mark = new google.maps.Marker({
            position : latlng,
            map : map,
            icon: markerIcon
        });
        return mark;
    }
};
