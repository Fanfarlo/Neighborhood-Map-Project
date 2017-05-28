var grouponTopNames = [];

class AppViewModel {
  constructor(){
  var self = this;
  var map, city, infowindow;
  var grouponLocations = [];


  this.markers = ko.observableArray([]); //holds all map markers
  this.grouponList = ko.observableArray([]); //list of deals
  this.list = ko.observableArray([]); //list filtered by search keyword
  this.dealError = ko.observable();
  this.dealStatus = ko.observable('Searching nerby...');
  this.searchStatus = ko.observable();
  this.searchLocation = ko.observable('Vancouver');
  this.loadImg = ko.observable();
  this.deals = ko.computed(function() {
    return self.list().length;
  });

  //Holds value for list togglings
  this.toggleList = ko.observable('hide list');

  //Hold the current location's (lat & lng) - for re-centering map
  this.currentLat = ko.observable(49.282729);
  this.currentLng = ko.observable(-123.120738);

  // If a deal is clicked, go to corresponding marker and open its info window.
  this.goToMarker = function(clickedDeal) {
    var clickedDealName = clickedDeal.dealName;
    self.markers().forEach(function(key) {
      if (clickedDealName === key.marker.title) {
        map.panTo(key.marker.position);
        map.setZoom(14);
        infowindow.setContent(key.content);
        infowindow.open(map, key.marker);
        map.panBy(0, -150);
        self.mobileShow(false);
        self.searchStatus('');
        //animation for clicking on the list
        toggleBounce(key.marker);
      }
    });
  };

  // Handle the input given when user searches for deals in a location
  this.processLocationSearch = function() {

    self.searchStatus('');
    self.searchStatus('Searching...');
    var newAddress = this.searchLocation().replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    });


    //hold the Groupon-formatted ID of the inputted city.
    var newGrouponId;
    for (var i = 0; i < 171; i++) {
      var name = grouponLocations.divisions[i].name;
      if (newAddress == name) {
        newGrouponId = grouponLocations.divisions[i].id;
        self.currentLat(grouponLocations.divisions[i].lat);
        self.currentLng(grouponLocations.divisions[i].lng);
      }
    }
    //Form validation
    if (!newGrouponId) {
      return self.searchStatus('Not a valid location, try again.');
    } else {
      //location for display in other KO bindings.
      self.searchLocation(newAddress);

      //clear current deal and marker arrays
      clearMarkers();
      self.grouponList([]);
      self.list([]);
      self.dealStatus('Loading...');
      self.loadImg('<img src="img/loader.gif">');
      //search and center map to new location
      getGroupons(newGrouponId);
      map.panTo({
        lat: self.currentLat(),
        lng: self.currentLng()
      });
    }
  };


  this.filterKeyword = ko.observable('');

  //Compare search keyword against existing deals.
  //Return a filtered list and map markers.

  this.filterResults = function() {
    var searchWord = self.filterKeyword().toLowerCase();
    var array = self.grouponList();
    if (!searchWord) {
      return;
    } else {
      //first clear out all entries in the list array
      self.list([]);
      //Loop through the grouponList array and see if the search keyword matches
      //with any of the deals in the list, if so push that object to the list array
      //and place the marker on the map.
      for (var i = 0; i < array.length; i++) {
        if (array[i].dealName.toLowerCase().indexOf(searchWord) != -1) {
          self.markers()[i].marker.setMap(map);
          self.list.push(array[i]);
        } else {
          self.dealStatus(self.deals() + ' deals found for ' + self.filterKeyword());

        }
      }
    }
  };

  //Clear keyword from filter
  //Show all deals in current location again.
  this.clearFilter = function() {
    self.list(self.grouponList());
    self.dealStatus(self.deals() + ' food and drink deals recommendations at ' + self.searchLocation());
    self.filterKeyword('');
    for (var i = 0; i < self.markers().length; i++) {
      self.markers()[i].marker.setMap(map);
    }
  };

  //toggles the list view
  this.listToggle = function() {
    if (self.toggleList() === 'hide list') {
      self.toggleList('show');
    } else {
      self.toggleList('hide list');
    }
  };

  //Error handling for Google Maps
  this.mapRequestTimeout = setTimeout(function() {
    $('#map').html('We had trouble loading Google Maps. Please refresh your browser and try again.');
  }, 8000);









  // Clear markers from map and array
  function clearMarkers() {
    $.each(self.markers(), function(key, value) {
      value.marker.setMap(null);
    });
    self.markers([]);
  }


  function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
      marker.setIcon(defaultIcon);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      marker.setIcon(highlightedIcon);
    }
  }




  //Toggling the list view, location centering, and search bar on a mobile device.

  this.mobileShow = ko.observable(false);
  this.searchBarShow = ko.observable(true);

  this.mobileToggleList = function() {
    if (self.mobileShow() === false) {
      self.mobileShow(true);
    } else {
      self.mobileShow(false);
    }
  };

  this.searchToggle = function() {
    if (self.searchBarShow() === true) {
      self.searchBarShow(false);
    } else {
      self.searchBarShow(true);
    }
  };

  //Re-center map to current city
  this.centerMap = function() {
    infowindow.close();
    var currCenter = map.getCenter();
    var cityCenter = new google.maps.LatLng(self.currentLat(), self.currentLng());
    if (cityCenter === currCenter) {
      self.searchStatus('Map is already centered.');
    } else {
      self.searchStatus('');
      map.panTo(cityCenter);
      map.setZoom(12);
    }
  };


}
};

// Initialize Google map.
initMap = () => {

  //styles from https://snazzymaps.com
  var styles = [{
      "featureType": "landscape",
      "stylers": [{
          "hue": "#F1FF00"
        },
        {
          "saturation": -27.4
        },
        {
          "lightness": 9.4
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "road.highway",
      "stylers": [{
          "hue": "#0099FF"
        },
        {
          "saturation": -20
        },
        {
          "lightness": 36.4
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "stylers": [{
          "hue": "#00FF4F"
        },
        {
          "saturation": 0
        },
        {
          "lightness": 0
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "road.local",
      "stylers": [{
          "hue": "#FFB300"
        },
        {
          "saturation": -38
        },
        {
          "lightness": 11.2
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "water",
      "stylers": [{
          "hue": "#00B6FF"
        },
        {
          "saturation": 4.2
        },
        {
          "lightness": -63.4
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "poi",
      "stylers": [{
          "hue": "#9FFF00"
        },
        {
          "saturation": 0
        },
        {
          "lightness": 0
        },
        {
          "gamma": 1
        }
      ]
    }
  ];

  city = new google.maps.LatLng(49.282729, -123.120738);
  map = new google.maps.Map(document.getElementById('map'), {
    center: city,
    zoom: 13,
    zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER,
      style: google.maps.ZoomControlStyle.SMALL
    },
    streetViewControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    styles: styles,
    mapTypeControl: false,
    panControl: false
  });

  clearTimeout(self.mapRequestTimeout);

  google.maps.event.addDomListener(window, "resize", function() {
    var center = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
  });

  infowindow = new google.maps.InfoWindow({
    maxWidth: 300
  });

  getGroupons('Vancouver');
  getGrouponLocations();

  // This function takes in a COLOR, and then creates a new marker
  // icon of that color. The icon will be 21 px wide by 34 high, have an origin
  // of 0, 0 and be anchored at 10, 34).
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21, 34));
    return markerImage;
  }
  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon('0091ff');

  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon('FFFF24');

};

mapError = () => {
  // Error handling
  function googleError() {
      alert("Google maps could not be loaded.");
  }
};

//custom binding highlights the search text on focus
ko.bindingHandlers.selectOnFocus = {
  update: function(element) {
    ko.utils.registerEventHandler(element, 'focus', function(e) {
      element.select();
    });
  }
};
// ---------------------------------------------grouponLocations

// Use API to get deal data and store the info as objects in an array
function getGroupons(location) {
  var grouponUrl = "https://partner-api.groupon.com/deals.json?tsToken=US_AFF_0_203644_212556_0&filters=category:food-and-drink&limit=7&offset=0&division_id=";
  var divId = location;

  $.ajax({
    url: grouponUrl + divId,
    dataType: 'jsonp',
    success: function(data) {
      //console.log(data);
      var len = data.deals.length;
      for (var i = 0; i < len; i++) {
        var venueLocation = data.deals[i].options[0].redemptionLocations[0];

        //filters out deals that don't have a physical location
        if (data.deals[i].options[0].redemptionLocations[0] === undefined) continue;

        var venueName = data.deals[i].merchant.name;
        venueLat = venueLocation.lat,
          venueLon = venueLocation.lng,
          gLink = data.deals[i].dealUrl,
          gImg = data.deals[i].mediumImageUrl,
          blurb = data.deals[i].pitchHtml,
          address = venueLocation.streetAddress1,
          city = venueLocation.city,
          state = venueLocation.state,
          zip = venueLocation.postalCode,
          shortBlurb = data.deals[i].announcementTitle,
          tags = data.deals[i].tags;

        // Yelp rating included.
        //If there is no rating, function will stop

        var rating;
        if ((data.deals[i].merchant.ratings == null) || data.deals[i].merchant.ratings[0] === undefined) {
          rating = '';
        } else {
          var num = data.deals[i].merchant.ratings[0].rating;
          var decimal = num.toFixed(1);
          rating = '<img src="img/burst_tiny.png"> ' + decimal + ' <span>out of 5</span>';
        }

        vm.grouponList.push({
          dealName: venueName,
          dealLat: venueLat,
          dealLon: venueLon,
          dealLink: gLink,
          dealImg: gImg,
          dealBlurb: blurb,
          dealAddress: address + "<br>" + city + ", " + state + " " + zip,
          dealShortBlurb: shortBlurb,
          dealRating: rating,
          dealTags: tags
        });

      }
      vm.list(vm.grouponList());
      markers(vm.grouponList());
      vm.searchStatus('');
      vm.loadImg('');
    },
    error: function() {
      vm.dealError('Oops, something went wrong, please refresh and try again.');
      vm.loadImg('');
    }
  });
}
// --------------------------------------
function getGrouponLocations() {
  $.ajax({
    url: 'https://partner-api.groupon.com/division.json',
    dataType: 'jsonp',
    success: function(data) {
      grouponLocations = data;
      for (var i = 0; i < 171; i++) {
        var readableName = data.divisions[i].name;
        grouponTopNames.push(readableName);
      }
    },
    error: function() {
      vm.dealStatus('Something went wrong, please reload the page and try again.');
      vm.loadImg('');
    }
  });
}





var vm = new AppViewModel();
ko.applyBindings(vm);
