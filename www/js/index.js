var map = null;

var userPosition = {};

function showSpinner()
{
        var options = {
            customSpinner : false,
            position : "middle",
            label : "Loading",
        bgColor: "#000",
        opacity:0.5,
        color: "#000"
        };
        window.wizSpinner.show(options);
}

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        showSpinner();
        map = new google.maps.Map(document.getElementById('map-canvas'), {
            zoom: 12,
            center: new google.maps.LatLng(41.3906611, 2.171749)
        });
        var options = {
            timeout: 10000,
        };
        navigator.geolocation.getCurrentPosition(app.onSuccess, app.onError, options);
        app.addClickListeners();
        document.addEventListener('menubutton', app.onMenuKeyDown, false);
        $('#travelMode-select').val(mapHelper.getTravelMode);
        console.log("pasamos");
    },

    onSuccess: function (position) {

        userPosition.lat = position.coords.latitude;
        userPosition.lng = position.coords.longitude;

        var icon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5
        };

        mapHelper.setMarker(userPosition.lat, userPosition.lng, icon);
        mapHelper.navigateToPoint(userPosition.lat, userPosition.lng);

        apiHelper.getCloseAnchors(userPosition.lat, userPosition.lng, app.onLocatedDataLoaded, function(error){});
    },
    onError: function (error) {
        console.log("mis");
        window.wizSpinner.hide();
        alert("Data loading has failed, please turn on GPS and come back.");
        apiHelper.getAllAnchors(app.onLocatedDataLoaded, function(error){
            alert("There's no internet connection")
        });
    },
    onLocatedDataLoaded: function (data) {
        window.wizSpinner.hide();
        for (var i = 0; i < data.length; i++) {
            var mark = mapHelper.setMarker(data[i].latitude, data[i].longitude);
            (function(marker, anchor){
                google.maps.event.addListener(marker, 'click', function(){
                    $('#floating-closest-anchor').html("<span class='anchor-name'>"+anchor.name+"</span>"+anchor.address).data("lat", anchor.latitude).data("lng", anchor.longitude);
                    mapHelper.getNavigationRoute(new google.maps.LatLng(userPosition.lat,userPosition.lng), marker.getPosition());
                });
            })(mark, data[i]);
        }
        $('#floating-closest-anchor').html('Your nearest parking is:' + 
                                            '<span class="anchor-name">' +
                                            data[0].name +
                                            '</span>').data("lat", data[0].latitude).data("lng",data[0].longitude);

        $('#floating-closest-anchor').addClass('active');

    },
    addClickListeners: function () {
        $('#floating-closest-anchor').on('click', function(){
            var data = $('#floating-closest-anchor').data();
            mapHelper.navigateToPoint(data.lat,data.lng);
        });

        $('#travelMode-select').change(function(){
            console.log("menu clicked");
            mapHelper.setTravelMode($('#travelMode-select').val());
            $('#travelMode-select').toggleClass("hidden");
        });
    },
    onMenuKeyDown: function(){
        $('#menu').toggleClass("hidden");
    }
};

var directionsDisplay = new google.maps.DirectionsRenderer();

var mapHelper = {
    directionsService: new google.maps.DirectionsService(),
    // directionsDisplay: new google.maps.DirectionsRenderer(),
    navigateToPoint: function (lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        map.panTo(latlng);
        map.setZoom(15);
    },
    setMarker: function (lat, lng, markerIcon) {
        var latlng = new google.maps.LatLng(lat, lng);
        var mark = new google.maps.Marker({
            position: latlng,
            map: map,
            animation: google.maps.Animation.DROP,
            icon: markerIcon
        });
        return mark;
    },
    getNavigationRoute: function(startLatLng, endLatLng){
        var request = {
            origin: startLatLng,
            destination: endLatLng,
            travelMode: mapHelper.getTravelMode()
        };

        directionsDisplay.setMap(map);
        mapHelper.directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
            }
        });
    },
    getTravelMode: function(){
        var travelMode = window.localStorage.getItem("TravelMode") || "WALKING";
        return travelMode;
    },
    setTravelMode: function(travelMode){
        window.localStorage.setItem("TravelMode", travelMode);
    }
};

var apiHelper = {
    apiUrl: "https://bcnbikeanchors.azure-mobile.net/api/parkings/",
    getCloseAnchors: function(lat, lng, success, error){
        var cacheItem = cacheHelper.getFromCache(lat,lng, new Date());
        if(cacheItem){
            success(cacheItem.parkings);
        }
        apiHelper.callService({lat: lat, lng: lng}, function(data){ cacheHelper.addToCache(lat,lng,data); success(data); } , error);
    },
    getAllAnchors: function(success, error){
        apiHelper.callService({}, success, error);
    },
    callService: function(params, success, error){
        var urlParams = apiHelper.objectToUrlParams(params || {});
        $.ajax({
            type: "GET",
            headers: {
                "X-ZUMO-APPLICATION": "UmlmPXSgHQmFpGlfnjDBUnFbofUqqs65"
            },
            url: apiHelper.apiUrl + urlParams,
            success: success,
            error: error
        });
    },
    searchByName : function (name, success, error){
        callService({name: name}, success, error);
    },
    objectToUrlParams: function(obj){
        if(!obj || obj === {}) return;
        var str = "?";
        for (var key in obj) {
            if (str != "?") {
                str += "&";
            }
            str += key + "=" + obj[key];
        }
        return str;
    }
};

var cacheHelper = {
    addToCache : function(lat, lng, parkings){
        var latlng = coordinatesHelper.getCommonPosition(lat,lng);
        var toStore = {
            timestamp: new Date(),
            lat: lat,
            lng: lng,
            parkings: parkings
        };
        window.localStorage.setItem(latlng.lat+";"+latlng.lng, JSON.stringify(toStore));
    },
    getFromCache: function(lat, lng, date){
        var latlng = coordinatesHelper.getCommonPosition(lat,lng);
        var itemString = window.localStorage.getItem(latlng.lat+";"+latlng.lng);
        if(itemString){
            var item = JSON.parse(itemString);
            if(DateDiff.inDays(item.timestamp || new Date(), new Date()) < 5){
                console.log("Got from cache "+ itemString);
                return item;
            }
            else
                return null;
        }
        return null;
    }
};

var coordinatesHelper = {
    getCommonPosition: function(lat, lng){
        return {lat: lat.toPrecision(1+4), lng: lng.toPrecision(1+4)};
    }
};

var DateDiff = {

    inDays: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2-t1)/(24*3600*1000));
    },

    inWeeks: function(d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2-t1)/(24*3600*1000*7));
    },

    inMonths: function(d1, d2) {
        var d1Y = d1.getFullYear();
        var d2Y = d2.getFullYear();
        var d1M = d1.getMonth();
        var d2M = d2.getMonth();

        return (d2M+12*d2Y)-(d1M+12*d1Y);
    },

    inYears: function(d1, d2) {
        return d2.getFullYear()-d1.getFullYear();
    }
}