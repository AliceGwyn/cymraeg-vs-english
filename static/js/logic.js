// Define CRS conversions for Proj4
proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

function transformCoords(coords) {
    return proj4("EPSG:27700", "EPSG:4326", coords);
}

// Transform British National Grid coordinates to World Geodetic System
function transformGeoJSONCoords(geojson) {
  geojson.features.forEach(function(feature) {
    if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates = feature.geometry.coordinates.map(polygon =>
        polygon.map(ring => ring.map(coord =>
          transformCoords(coord)
        ))
      );
    }
  });
  console.log('Transformed GeoJSON:', geojson);
  return geojson;
}

// Define map
let myMap = L.map('map', {
  center:[52.1307, -3.7837],
  zoom: 8
});

// Add background tileset to map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(myMap);

// Initialized Marker Cluster Group
var markerClusterGroup = L.markerClusterGroup();
myMap.addLayer(markerClusterGroup);

// Define Marker Cluster SubGroups
let EngSub = L.featureGroup.subGroup(markerClusterGroup);
let WelshSub = L.featureGroup.subGroup(markerClusterGroup);
let DualSub = L.featureGroup.subGroup(markerClusterGroup);
let EngSigWelshSub = L.featureGroup.subGroup(markerClusterGroup);
let TransitionalSub = L.featureGroup.subGroup(markerClusterGroup);

// Set icons
let icons = {
  ["English medium"]: L.ExtraMarkers.icon({
    icon: "ion-happy-outline",
    iconColor: "white",
    markerColor: "green",
    shape: "circle"
  }),
  ["Welsh medium"]: L.ExtraMarkers.icon({
    icon: "ion-happy-outline",
    iconColor: "white",
    markerColor: "red",
    shape: "circle"
  }),
  ["Dual stream"]: L.ExtraMarkers.icon({
    icon: "ion-ios-toggle",
    iconColor: "white",
    markerColor: "blue",
    shape: "star"
  }),
  ["English with significant Welsh"]: L.ExtraMarkers.icon({
    icon: "ion-chatbubbles",
    iconColor: "black",
    markerColor: "yellow",
    shape: "star"
  }),
  Transitional: L.ExtraMarkers.icon({
    icon: "ion-android-sync",
    iconColor: "white",
    markerColor: "pink",
    shape: "star"
  })
};

// Pull school data
let primarySchools = "./static/js/cymraeg_primary_schools.json";

// Get the data with d3.
d3.json(primarySchools).then(function(data) {
 console.log("School Data:", data);
  for (let i = 0; i < data.features.length; i++) {
    // Set the data location property to a variable.
    let location = [data.features[i].properties.lat, data.features[i].properties.lon];
    // Add markers to SubGroups based on language used
    if (data.features[i].properties.language.toLowerCase() === "english medium") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`<h1>Name: ${data.features[i].properties.name}</h1><br><h2 style="color:green;">Language: ${data.features[i].properties.language}</h2><br><h2>Location: ${data.features[i].properties.town_name}</h2>`)
      .addTo(EngSub);
    } else if (data.features[i].properties.language.toLowerCase() === "welsh medium") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`<h1>Name: ${data.features[i].properties.name}</h1><br><h2 style="color:red;">Language: ${data.features[i].properties.language}</h2><br><h2>Location: ${data.features[i].properties.town_name}</h2>`)
      .addTo(WelshSub);
    } else if (data.features[i].properties.language === "Dual stream") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`<h1>Name: ${data.features[i].properties.name}</h1><br><h2 style="color:blue;">Language: ${data.features[i].properties.language}</h2><br><h2>Location: ${data.features[i].properties.town_name}</h2>`)
      .addTo(DualSub);
    } else if (data.features[i].properties.language === "English with significant Welsh") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`<h1>Name: ${data.features[i].properties.name}</h1><br><h2 style="color:goldenrod;">Language: ${data.features[i].properties.language}</h2><br><h2>Location: ${data.features[i].properties.town_name}</h2>`)
      .addTo(EngSigWelshSub);
    } else if (data.features[i].properties.language === "Transitional") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`<h1>Name: ${data.features[i].properties.name}</h1><br><h2 style="color:purple;">Language: ${data.features[i].properties.language}</h2><br><h2>Location: ${data.features[i].properties.town_name}</h2>`)
      .addTo(TransitionalSub);
    } else {
      console.log(data.features[i].properties)
    }}
    // Add our marker cluster layer to the map.
    markerClusterGroup.addTo(myMap);
});

// Add Marker SubGroups to map
myMap.addLayer(EngSub);
myMap.addLayer(WelshSub);
myMap.addLayer(DualSub);
myMap.addLayer(EngSigWelshSub);
myMap.addLayer(TransitionalSub);

// Define selectable options for marker layers
let overlays = {
  "English Medium": EngSub,
  "Welsh Medium": WelshSub,
  "Dual Stream": DualSub,
  "English with Significant Welsh": EngSigWelshSub,
  "Transitional": TransitionalSub
};

L.control.layers(null, overlays).addTo(myMap);


// Pull data from Welsh Census
let url = "https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typename=geonode%3Awelsh_language_2021&outputFormat=json&srs=EPSG%3A27700&srsName=EPSG%3A27700"
//let url = "https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typename=geonode%3Awelsh_by_lsoa&outputFormat=json&srs=EPSG%3A27700&srsName=EPSG%3A27700"

// Define the URLs for the choropleth data for 2011 and 2021
const url2011 = "https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typename=geonode%3Awelsh_by_lsoa&outputFormat=json&srs=EPSG%3A27700&srsName=EPSG%3A27700";
const url2021 = "https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typename=geonode%3Awelsh_language_2021&outputFormat=json&srs=EPSG%3A27700&srsName=EPSG%3A27700";
const urlcomp = "https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typename=geonode%3Awelsh_language_change_2021&outputFormat=json&srs=EPSG%3A27700&srsName=EPSG%3A27700";

let legend;
let geoJSON

function display2021Data() {
  d3.json(url2021).then(function(data) {
    let transformedGeoJSON = transformGeoJSONCoords(data);

      geoJSON = L.choropleth(transformedGeoJSON, {
        valueProperty: "percentage",
        scale: ["#00b140", "#c8102e"],
        steps: 12,
        mode: "q",
        style: {
          color: "#fff",
          weight: 1,
          fillOpacity: 0.5
        },
        onEachFeature: function (feature, layer) {
          layer.on({
            // Change opacity on mouseover/mouseout
            mouseover: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.9
              });
            },
            mouseout: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.5
              });
            }
          });
          // Give each LSOA a popup with information
          layer.bindPopup('<h1>' + feature.properties.lsoaname + '</h1><br><h2>Welsh Speakers: <strong>' + feature.properties.percentage + '%</strong></h2>');
        }
      }).addTo(myMap);
      
      // Set up the legend.
      legend = L.control({position: "bottomright"});
      legend.onAdd = function() {
      let div = L.DomUtil.create("div", "info legend");
      let limits = geoJSON.options.limits;
      let colors = geoJSON.options.colors;
      let labels = [];

      // Add the minimum and maximum.
      let legendInfo = "<h1>Percentage of Welsh Speakers<br />(ages 3 and up)</h1>" +
        "<div class=\"labels\">" +
          "<div class=\"min\">" + limits[0] + "</div>" +
          "<div class=\"max\">" + limits[limits.length - 1] + "</div>" +
        "</div>";

      div.innerHTML = legendInfo;

      limits.forEach(function(limit, index) {
        labels.push("<li style=\"background-color: " + colors[index] + "\"></li>");
      });

      div.innerHTML += "<ul>" + labels.join("") + "</ul>";
      return div;
    };
    // Adding the legend to the map
    legend.addTo(myMap);  
})};

function display2011Data() {
  d3.json(url2011).then(function(data) {
    let transformedGeoJSON = transformGeoJSONCoords(data);

      geoJSON = L.choropleth(transformedGeoJSON, {
        valueProperty: "Welsh",
        scale: ["#00b140", "#c8102e"],
        steps: 12,
        mode: "q",
        style: {
          color: "#fff",
          weight: 1,
          fillOpacity: 0.5
        },
        onEachFeature: function (feature, layer) {
          layer.on({
            // Change opacity on mouseover/mouseout
            mouseover: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.9
              });
            },
            mouseout: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.5
              });
            }
          });
          // Give each LSOA a popup with information
          layer.bindPopup('<h1>' + feature.properties.LSOA11NM + '</h1><br><h2>Welsh Speakers: <strong>' + feature.properties.Welsh + '%</strong></h2>');
        }
      }).addTo(myMap);
      
      // Set up the legend.
      legend = L.control({position: "bottomright"});
      legend.onAdd = function() {
      let div = L.DomUtil.create("div", "info legend");
      let limits = geoJSON.options.limits;
      let colors = geoJSON.options.colors;
      let labels = [];

      // Add the minimum and maximum.
      let legendInfo = "<h1>Percentage of Welsh Speakers<br />(ages 3 and up)</h1>" +
        "<div class=\"labels\">" +
          "<div class=\"min\">" + limits[0] + "</div>" +
          "<div class=\"max\">" + limits[limits.length - 1] + "</div>" +
        "</div>";

      div.innerHTML = legendInfo;

      limits.forEach(function(limit, index) {
        labels.push("<li style=\"background-color: " + colors[index] + "\"></li>");
      });

      div.innerHTML += "<ul>" + labels.join("") + "</ul>";
      return div;
    };
    // Adding the legend to the map
    legend.addTo(myMap);  
})};

function displayCompData() {
  d3.json(urlcomp).then(function(data) {
    let transformedGeoJSON = transformGeoJSONCoords(data);

      geoJSON = L.choropleth(transformedGeoJSON, {
        valueProperty: "pchange",
        scale: ["#00b140", "#c8102e"],
        steps: 12,
        mode: "q",
        style: {
          color: "#fff",
          weight: 1,
          fillOpacity: 0.5
        },
        onEachFeature: function (feature, layer) {
          layer.on({
            // Change opacity on mouseover/mouseout
            mouseover: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.9
              });
            },
            mouseout: function(event) {
              layer = event.target;
              layer.setStyle({
                fillOpacity: 0.5
              });
            }
          });
          // Give each LSOA a popup with information
          layer.bindPopup('<h1>' + feature.properties.lsoaname + '</h1><br><h2>Change in Welsh Speakers: <strong>' + feature.properties.pchange + '%</strong></h2>');
        }
      }).addTo(myMap);
      
      // Set up the legend.
      legend = L.control({position: "bottomright"});
      legend.onAdd = function() {
      let div = L.DomUtil.create("div", "info legend");
      let limits = geoJSON.options.limits;
      let colors = geoJSON.options.colors;
      let labels = [];

      // Add the minimum and maximum.
      let legendInfo = "<h1>Change in Percentage of Welsh Speakers between 2011 and 2021<br />(ages 3 and up)</h1>" +
        "<div class=\"labels\">" +
          "<div class=\"min\">" + limits[0] + "</div>" +
          "<div class=\"max\">" + limits[limits.length - 1] + "</div>" +
        "</div>";

      div.innerHTML = legendInfo;

      limits.forEach(function(limit, index) {
        labels.push("<li style=\"background-color: " + colors[index] + "\"></li>");
      });

      div.innerHTML += "<ul>" + labels.join("") + "</ul>";
      return div;
    };
    // Adding the legend to the map
    legend.addTo(myMap);  
})};

// Add event listeners for dropdown change
document.getElementById("options").addEventListener("change", function() {
  let selectedYear = this.value;
  if (legend != undefined) {
    console.log("Legend cleared")
    myMap.removeControl(legend)};
  if (geoJSON != undefined) {
    console.log("GeoJSON cleared")
    myMap.removeLayer(geoJSON)};
  if (selectedYear === "2011data") {
    display2011Data(); 
  } else if (selectedYear === "2021data"){
    display2021Data(); 
  } else {
    displayCompData();
  }
});

// Load 2011 on start
display2011Data();