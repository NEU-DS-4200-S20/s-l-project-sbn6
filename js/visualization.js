// global visualization size variables
var width = 960;
var height = 500;

// define the svg container
var svg = d3
  .select("#map-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// define svg2 container for 2nd visualization
var svg2 = d3
  .select("#chart-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// define map projection for map viz
var projection = d3   
.geoMercator()   
.translate([width*4.2,height*5.3])   
.scale(2800);

// define path
var path = d3.geoPath().projection(projection);


// chain calling of drawMap to handle drawing the map viz
d3.json("us.json", function(us) {
  //Error
  d3.csv("data/sbn-data-cleaned.csv", function(clients) {
    d3.csv("data/sbn-states.csv", function(states) {
      d3.tsv("data/us-state-names.tsv", function(stateNames) {
        drawMap(us, clients, states, stateNames);
        // drawChart(clients);
      });
    });
  });
});

// brush declaration
var brush = d3
  .brush()
  .on("start brush", highlight)
  .on("end", brushend);



// Below is from the starter code from demo, which we may or may not use

// function drawChart(cities) {
//   let margin = {
//     top: 20,
//     right: 30,
//     bottom: 40,
//     left: 30
//   }


//   // Create a scale
//   let xScale = d3.scaleLinear()
//                   .domain([
//                     d3.min(cities, function(d) { return d.food; }),
//                     d3.max(cities, function(d) { return d.food; })
//                   ])
//                   .range([margin.left, width - margin.right])

//   let yScale = d3.scaleLinear()
//                   .domain([
//                     d3.min(cities, function(d) { return d.diversity; }),
//                     d3.max(cities, function(d) { return d.diversity; })
//                   ])
//                   .range([height - margin.bottom, margin.top])

//   // Create an axis
//   let xAxis = d3.axisTop()
//                 .scale(xScale)
//                 .ticks(5);
//   let yAxis = d3.axisRight()
//                 .scale(yScale)
//                 .ticks(5);

//   let highlightChart = function(d) {
//     if (d3.event.selection === null) return;

//     let [[x0, y0], [x1, y1]] = d3.event.selection;

//     circles = d3.selectAll("circle");

//     circles.classed(
//       "selected",
//       d =>
//         x0 <= xScale(d.food) &&
//         xScale(d.food) <= x1 &&
//         y0 <= yScale(d.diversity) &&
//         yScale(d.diversity) <= y1
//     );

//   }

//   var brush2 = d3
//     .brush()
//     .on("start brush", highlightChart)



//   // Render the axis
//   svg2.append('g')
//       .call(xAxis)
//       .attr('transform', 'translate(0,' + (height - 5) + ')')
//   svg2.append('g').call(yAxis)

//   // Render the points
//   svg2.selectAll('circle')
//       .data(cities)
//       .enter()
//         .append('circle')
//         .attr('cx', function(d) { return xScale(d.food)})
//         .attr('cy', function(d) { return yScale(d.diversity)})
//         .attr('r', 5)
//         .attr('fill', 'orange')
//   svg2.append("g").call(brush2);
// }

// Draws the map visualization
function drawMap(us, clients, states, stateNames) {
  var mapGroup = svg.append("g").attr("class", "mapGroup");

  // Colors states by whether or not they have SBN buisnesses in them
  let fillFunction = function(d) {
    // console.log("statesVisited: ", statesVisited);
    // console.log("stateNames: ", stateNames);
    let stateCode = stateNames.filter(function (n) { return n.id == d.id })[0].code
    let statesVisitedAbv = states.map(function (s) { return s.Abv } );
    // TODO: rename isVisisted to something better
    let isVisited = statesVisitedAbv.includes(stateCode);

    if (isVisited) {
      return 'blue';
    } else {
      return 'gray';
    }
  }

  
  mapGroup
    .append("g")
    // .attr("id", "states")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", fillFunction)
    .attr("class", "states")

    // For debugging purposes, add:

    // .on('mouseover', function(d) {
    //   // console.log("mouseover state", d)
    //   // console.log(this)
    //   let state = d3.select(this);
    //   state.attr("fill", "red");
    // })
    // .on('mouseout', function(d) {
    //   let state = d3.select(this);
    //   state.attr("fill", fillFunction);
    // });

    // Add state borders to mapGroup
  mapGroup
    .append("path")
    .datum(
      topojson.mesh(us, us.objects.states, function(a, b) {
        return a !== b;
      })
    )
    .attr("id", "state-borders")
    .attr("d", path);

    // Add circles for each business in the client CSV
  var circles = svg
    .selectAll("circle")
    .data(clients)
    .enter()
    .append("circle")
    .attr("class", "cities")
    // CX is the longitutde
    .attr("cx", function(d) {
      return projection([d.lon, d.lat])[0];
    })
    // CY is the latitude
    .attr("cy", function(d) {
      return projection([d.lon, d.lat])[1];
    })
    // Radius of the dots
    .attr("r", 7);
  svg.append("g").call(brush);

}

// Handles highlighting of selected circles from the brush
function highlight() {
  if (d3.event.selection === null) return;

  let [[x0, y0], [x1, y1]] = d3.event.selection;

  circles = d3.selectAll("circle");

  circles.classed(
    "selected",
    d =>
      x0 <= projection([d.lon, d.lat])[0] &&
      projection([d.lon, d.lat])[0] <= x1 &&
      y0 <= projection([d.lon, d.lat])[1] &&
      projection([d.lon, d.lat])[1] <= y1
  );
}

function brushend() {
  console.log("end");
}

// Adds an SVG for the map's legend
var legend = svg
  .append("g")
  .attr("class", "legend")
  .attr("width", 140)
  .attr("height", 200)
  .selectAll("g")
  // Determine legend meaning from color attr
  .data([
    {'color': 'orange', 'label': 'SBN Business Locations'}, 
    {'color': 'gray', 'label': 'States with No SBN Members'},
    {'color': 'blue', 'label': 'States with SBN Memebers'}
  ])
  .enter()
  .append("g")
  .attr("transform", function(d, i) {
    return "translate(0," + i * 20 + ")";
  });

// Create the color boxes for the legend
legend
  .append("rect")
  .attr("width", 18)
  .attr("height", 18)
  .style("fill", function(d) { 
    return d.color
  });

// add labels to the color boxes in the legend
legend
  .append("text")
  .attr("x", 24)
  .attr("y", 9)
  .attr("dy", ".35em")
  .text(function(d) { return d.label});
