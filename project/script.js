// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoiYWFtb250YWx2byIsImEiOiJjbGNxNXZjbW8wMnB6M3hwZHJpN3dwNnFiIn0.R7MOtTlPIN-TRcwZ6MxLwQ";

const map = new mapboxgl.Map({
  container: "map",
  // Replace YOUR_STYLE_URL with your style URL.
  style: "mapbox://styles/aamontalvo/cldaitdzg007a01lixs0n06qr",
  center: [-75.907725, 4.2], // CAMBIAR CON EL CENTROIDE DE COLOMBIA
  zoom: 4.2
});

map.on("mousemove", (event) => {
  const dzone = map.queryRenderedFeatures(event.point, {
    layers: ["datos-deforestacioncolombia"]
  });
  document.getElementById("pd").innerHTML = dzone.length
    ? `<p> <strong> State:</strong> ${dzone[0].properties.NOMBRE_DPT}</p>
    <p> <strong>Value:</strong> ${dzone[0].properties.total_lost} ha</p>`
    : `<p>Hover over a data zone!</p>`;

  map.getSource("hover").setData({
    type: "FeatureCollection",
    features: dzone.map(function (f) {
      return { type: "Feature", geometry: f.geometry };
    })
  });
});

const geocoder = new MapboxGeocoder({
  // Initialize the geocoder
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false, // Do not use the default marker style
  placeholder: "Search for places in Colombia", // Placeholder text for the search bar
  proximity: {
    longitude: -75.90772542,
    latitude: 4.2518
  }
});

map.addControl(geocoder, "top-right");
map.addControl(new mapboxgl.NavigationControl(), "top-right");

map.on("load", () => {
  map.addSource("hover", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  map.addLayer({
    id: "dz-hover",
    type: "line",
    source: "hover",
    layout: {},
    paint: {
      "line-color": "black",
      "line-width": 3
    }
  });
});

// NO PERMITIR QUE HAGA ZOOM OUT MAS ALLA DEL PERMITIDO
map.setMinZoom(5);