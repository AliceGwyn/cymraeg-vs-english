proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

function transformCoords(coords) {
    return proj4("EPSG:27700", "EPSG:4326", coords);
}

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
/*
let layersPrimary = {
  ["English medium"]: new L.LayerGroup(), 
  ["Welsh medium"]: new L.LayerGroup(), 
  ["Dual stream"]: new L.LayerGroup(),
  ["English with significant Welsh"]: new L.LayerGroup(),
  Transitional: new L.LayerGroup()
};
*/
let myMap = L.map('map', {
  center:[52.1307, -3.7837],
  zoom: 8,
  /*
  layers: [
    layersPrimary["English medium"],
    layersPrimary["Welsh medium"],
    layersPrimary["Dual stream"],
    layersPrimary["English with significant Welsh"],
    layersPrimary.Transitional
  ]
    */
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(myMap);

var markerClusterGroup = L.markerClusterGroup();
myMap.addLayer(markerClusterGroup);


let EngSub = L.featureGroup.subGroup(markerClusterGroup);
let WelshSub = L.featureGroup.subGroup(markerClusterGroup);
let DualSub = L.featureGroup.subGroup(markerClusterGroup);
let EngSigWelshSub = L.featureGroup.subGroup(markerClusterGroup);
let TransitionalSub = L.featureGroup.subGroup(markerClusterGroup);

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

//let languagePrimary;

let primarySchools = "./static/js/cymraeg_primary_schools.json";
// Get the data with d3.
d3.json(primarySchools).then(function(data) {
// console.log(data);
//if (data.features[i].properties.language == "English medium") {
//  languagePrimary = ""
//}
// Create a new marker cluster group.
  //let markers = L.markerClusterGroup();
  // Loop through the data.
  for (let i = 0; i < data.features.length; i++) {
    // Set the data location property to a variable.
    let location = [data.features[i].properties.lat, data.features[i].properties.lon];
    // Add a new marker to the cluster group, and bind a popup.
    // console.log(data.features[i].properties.language)
    //L.marker(location, {icon: icons[data.features[i].properties.language]})
    //.bindPopup(`${data.features[i].properties.name}<br>${data.features[i].properties.language}<br>${data.features[i].properties.town_name}`)
    // markerClusterGroup.addLayer(newMarker);
    if (data.features[i].properties.language.toLowerCase() === "english medium") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`${data.features[i].properties.name}<br>${data.features[i].properties.language}<br>${data.features[i].properties.town_name}`)
      .addTo(EngSub);
    } else if (data.features[i].properties.language.toLowerCase() === "welsh medium") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`${data.features[i].properties.name}<br>${data.features[i].properties.language}<br>${data.features[i].properties.town_name}`)
      .addTo(WelshSub);
    } else if (data.features[i].properties.language === "Dual stream") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`${data.features[i].properties.name}<br>${data.features[i].properties.language}<br>${data.features[i].properties.town_name}`)
      .addTo(DualSub);
    } else if (data.features[i].properties.language === "English with significant Welsh") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`${data.features[i].properties.name}<br>${data.features[i].properties.language}<br>${data.features[i].properties.town_name}`)
      .addTo(EngSigWelshSub);
    } else if (data.features[i].properties.language === "Transitional") {
      L.marker(location, {icon: icons[data.features[i].properties.language]})
      .bindPopup(`${data.features[i].properties.name}<br>${data.features[i].properties.language}<br>${data.features[i].properties.town_name}`)
      .addTo(TransitionalSub);
    } else {
      console.log(data.features[i].properties)
    }
    }
    // Add our marker cluster layer to the map.
    markerClusterGroup.addTo(myMap);
});

myMap.addLayer(EngSub);
myMap.addLayer(WelshSub);
myMap.addLayer(DualSub);
myMap.addLayer(EngSigWelshSub);
myMap.addLayer(TransitionalSub);

let overlays = {
  "English Medium": EngSub,
  "Welsh Medium": WelshSub,
  "Dual Stream": DualSub,
  "English with Significant Welsh": EngSigWelshSub,
  "Transitional": TransitionalSub
};

L.control.layers(null, overlays).addTo(myMap);



let url = "https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typename=geonode%3Awelsh_language_2021&outputFormat=json&srs=EPSG%3A27700&srsName=EPSG%3A27700"
//let url = "https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typename=geonode%3Awelsh_by_lsoa&outputFormat=json&srs=EPSG%3A27700&srsName=EPSG%3A27700"

d3.json(url).then(function(data) {
  let transformedGeoJSON = transformGeoJSONCoords(data);

    let geoJSON = L.choropleth(transformedGeoJSON, {
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
          layer.bindPopup('<strong>' + feature.properties.lsoaname + '</strong><br>Percentage of Welsh Speakers: ' + feature.properties.percentage);
      }
    }).addTo(myMap);
    
    // Need to adjust location of legend!
    // Set up the legend.
  let legend = L.control();
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
  
});