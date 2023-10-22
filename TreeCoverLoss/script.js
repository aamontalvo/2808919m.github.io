// MapBox Acces
mapboxgl.accessToken =
  "pk.eyJ1IjoiYWFtb250YWx2byIsImEiOiJjbGNxNXZjbW8wMnB6M3hwZHJpN3dwNnFiIn0.R7MOtTlPIN-TRcwZ6MxLwQ";
const bounds = [
  [-92, -7], // Southwest coordinates
  [-55, 16] // Northeast coordinates
];
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/aamontalvo/cldaitdzg007a01lixs0n06qr",
  center: [-75.907725, 4.2],
  zoom: 4.5,
  maxBounds: bounds
});
// GEOCODER AND BOUNDARIES
const geocoder = new MapboxGeocoder({
  // Initialize the geocoder
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false, // Do not use the default marker style
  placeholder: "Search departments in Colombia", // Placeholder text for the search bar
  proximity: {
    longitude: -75.90772542,
    latitude: 4.2518
  }
});
// OTHER MAPBOX CONTROLS
map.addControl(geocoder, "top-right");
map.addControl(new mapboxgl.NavigationControl(), "top-right");
// Zoom Boundaries
map.setMinZoom(4.5);
map.setMaxZoom(6);

// HOOVER INTERACTION
map.on("mousemove", (event) => {
  const dzone = map.queryRenderedFeatures(event.point, {
    layers: ["treecoverloss"]
  });
  document.getElementById("pd").innerHTML = dzone.length
    ? `<p> <strong> Department:</strong> ${dzone[0].properties.NOMBRE_DPT}</p>
    <p> <strong>Tree Cover Area (2012):</strong> ${dzone[0].properties.total_lost} ha</p>`
    : `<p>Tree cover loss is defined as <i>stand replacement disturbance</i> or removal of tree cover canopy at the pixel scale. It must not be confused with deforestation. Satellite information comes from Landsat data.<strong> Select a department to modify the  time series.</strong></p>`;

  map.getSource("hover").setData({
    type: "FeatureCollection",
    features: dzone.map(function (f) {
      return { type: "Feature", geometry: f.geometry };
    })
  });
});

map.on("load", () => {
  const layers = [">13", "9", "6", "3", "0.3"];
  const colors = ["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837"];
  // create legend
  const legend = document.getElementById("legend");
  layers.forEach((layer, i) => {
    const color = colors[i];
    const key = document.createElement("div");
    //place holder
    if (i > 2) {
      key.style.color = "white";
    }

    key.className = "legend-key";
    key.style.backgroundColor = color;
    key.innerHTML = `${layer}`;

    legend.appendChild(key);
  });

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
      "line-color": "yellow",
      "line-width": 2
    }
  });
});

/*  LINEGRAPH
 */
// Dimensions and margins of the graph
var margin = { top: 0, right: 30, bottom: 30, left: 60 },
  width = 280 - margin.left - margin.right,
  height = 225 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("#linegraph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv(
  "https://raw.githubusercontent.com/aamontalvo/Cartography-Labs/main/project/treecover_loss_processdata2.csv",
  function (data) {
    // List of groups
    var allGroup = d3
      .map(data, function (d) {
        return d.NOMBRE_DPT;
      })
      .keys();

    // add the options to the button
    d3.select("#selectButton")
      .selectAll("myOptions")
      .data(allGroup)
      .enter()
      .append("option")
      .text(function (d) {
        return d;
      })

      .attr("zscore", function (d) {
        return d;
      }); // corresponding value returned by the button

    // A color pallette
    var myColor = d3.scaleOrdinal().domain(allGroup).range(d3.schemePaired);

    // Add X axis
    var x = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return d.year;
        })
      )
      .range([0, width]);
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(5));

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain([
        -2,
        d3.max(data, function (d) {
          return +d.zscore;
        })
      ])
      .range([height, 0]);
    svg.append("g").call(d3.axisLeft(y).ticks(7));
    svg
      .append("text")
      .attr("class", "y label")
      .attr("text-anchor", "start")
      .attr("y", 2)
      .attr("dy", "1.2em")
      .text("Z score Lost Area (ha)");

    // Initialize line with first group of the list
    var line = svg
      .append("g")
      .append("path")
      .datum(
        data.filter(function (d) {
          return d.NOMBRE_DPT == allGroup[0];
        })
      )
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(d.year);
          })
          .y(function (d) {
            return y(+d.zscore);
          })
      )
      .attr("stroke", function (d) {
        return myColor("valueA");
      })
      .style("stroke-width", 4)
      .style("fill", "none");

    // A function that update the chart
    function update(selectedGroup) {
      // Create new data with the selection?
      var dataFilter = data.filter(function (d) {
        return d.NOMBRE_DPT == selectedGroup;
      });

      // Give these new data to update line
      line
        .datum(dataFilter)
        .transition()
        .duration(1000)
        .attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return x(d.year);
            })
            .y(function (d) {
              return y(+d.zscore);
            })
        )
        .attr("stroke", function (d) {
          return myColor(selectedGroup);
        });
    }

    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function (d) {
      // recover the option that has been chosen
      var selectedOption = d3.select(this).property("value");
      // run the updateChart function with this selected option
      update(selectedOption);
    });
  }
);

// CLICK INTERACTION: DE-STANDARAZATION PARAMETERS
map.on("load", () => {
  // Add a source for the state polygons.
  map.addSource("states", {
    type: "geojson",
    data:
       "https://raw.githubusercontent.com/aamontalvo/Cartography-Labs/main/project/TreeCoverLoss_popup.geojson"
  });

  // Polygons
  map.addLayer({
    id: "states-layer",
    type: "fill",
    source: "states",
    paint: {
      "fill-color": "rgba(0, 0, 0, 0)" // In order that no overlapped the others
    }
  });
  // When a click event occurs on a feature in the states layer,
  // open a popup at the location of the click, with description
  // HTML from the click event's properties.
  map.on("click", "states-layer", (e) => {
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(
        `<p><strong>${e.features[0].properties.NOMBRE_DPT}</strong></p>
    <p> Mean: ${e.features[0].properties.Mean_2021} ha</p>
    <p> Std Dv: ${e.features[0].properties.Std_2021} ha</p>`
      )
      .addTo(map);
  });

  // Change the cursor to a pointer when
  // the mouse is over the states layer.
  map.on("mouseenter", "states-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change the cursor back to a pointer
  // when it leaves the states layer.
  map.on("mouseleave", "states-layer", () => {
    map.getCanvas().style.cursor = "";
  });
});
