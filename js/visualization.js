// global visualization size variables
var width = 960;
var height = 500;

// define the svg container
var svg = d3
  .select("#vis-svg")
  .append("g");

// define svg2 container for 2nd visualization
var svg2 = d3
  .select("#svg-2")
  .append("g")
  .attr("width", width)
  .attr("height", height);

var newEnglandProjection = d3   
.geoMercator()   
.translate([4032,2650])   
.scale(2800);

var massProjection = d3.
  geoMercator()
  .translate([12960,8400])
  .scale(10000);

// define map projection for map viz
var projection = newEnglandProjection;

// define path
var path = d3.geoPath().projection(projection);

// chain calling of drawMap to handle drawing the map viz
d3.json("data/us.json", function(us) {
  //Error
  d3.csv("data/sbn-data-cleaned.csv", function(clients) {
    d3.csv("data/sbn-states.csv", function(states) {
      d3.tsv("data/us-state-names.tsv", function(stateNames) {
        drawMap(us, clients, states, stateNames);
        drawBar(clients)
      });
    });
  });
});

// brush declaration
var brush = d3
  .brush()
  .on("start brush", highlight)
  .on("end", brushend);

function drawBar(clients,normalColor = true){
  svg2.select('g').data([]).exit().remove();

  let margin = {
    top: 20,
    right: 30,
    bottom: 40,
    left: 30
  }
  bWidth = width - margin.left - margin.right;
  bHeight = height - margin.top - margin.bottom;

  var x = d3.scaleBand()
      .range([0,bWidth])
      .padding(0.1)

  var y = d3.scaleLinear()
      .range([bHeight,0]);

  var clientPerIndustry = d3.nest()
      .key(function(d){return d.Industry})
      .rollup(function(v){return v.length})
      .entries(clients)

   var myColor = d3.scaleOrdinal().domain(
      clientPerIndustry.length
      ).range(d3.schemeSet2);

  //console.log(clientPerIndustry)

 var space = svg2.append("g")
    .data(clientPerIndustry)
    .attr("width", bWidth + margin.left + margin.right)
    .attr("height", bHeight + margin.top + margin.bottom)
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

  space.exit().remove();

  const t = d3.transition().duration(200);

  space.transition(t);
  x.domain(clientPerIndustry.map(function(d){return d.key}));

  y.domain([0,d3.max(clientPerIndustry, function(d){return d.value;})]);

  var barchart = space.selectAll("rect")
      .data(clientPerIndustry)
      .enter()
      .append("rect")
      .attr("y",function(d){
        return bHeight + margin.top
      })
      .attr("height", function(d) { 
          return 0;
      })
      .attr("width",x.bandwidth())
      .attr("x",function(d){
        return x(d.key)
      })
      .style("fill", function(d){
        if(normalColor){
           return myColor(d.key);
        }else{
          return "#8dd6c2";
        }
      }); //enter a color here

  barchart.transition(t)
  .attr("height", function(d) { 
          return bHeight - y(d.value)
      })
  .attr("y", function(d){
    return y(d.value);
  })

  space.append("g")
    .attr("transform", "translate(0," + bHeight + ")")
    .call(d3.axisBottom(x));

  space.append("g")
    .call(d3.axisLeft(y));

}

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

  d3.select("#changeMap")
    .on("click",changeMap)
  
  function changeMap(){
    
    if(projection == newEnglandProjection){
      projection = massProjection;
    }else{
      projection = newEnglandProjection;
    }

    path = d3.geoPath().projection(projection);
    
    /*
    d3.select(".mapGroup").selectAll("path").transition().duration(1000)
      .attr("d",path)
    */
    d3.select(".brush").remove();
    d3.select(".mapGroup").selectAll("circle").transition().duration(1000)
    .attr("cx", function(d) {
        return projection([d.lon, d.lat])[0];
      })
    .attr("cy", function(d) {
        return projection([d.lon, d.lat])[1];
      })
   //d3.selectAll(".selection")
    //  .remove();
    d3.select(".mapGroup").html("")
    renderMap();
    d3.select(".legend").remove()
    drawLegend();
  } 

  renderMap();
  drawLegend();

  function renderMap(){
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
    var myColor = d3.scaleOrdinal().domain(

      d3.nest()
      .key(function(d){return d.Industry})
      .rollup(function(v){return v.length})
      .entries(clients).length

      ).range(d3.schemeSet2);

    var circles = mapGroup
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
      .attr("r", 4)
      .attr('fill', function(d){return myColor(d.Industry)});

      svg.append("g").call(brush).attr("class","brush");
  }
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

  table = d3.selectAll('table');
  item = d3.selectAll('tbody');

  sel = []
  selectedDots = d3.selectAll('.cities.selected').each(function(d,i){
    sel.push(d["Name of Business or Organization"])
  })


  item.selectAll('tr')
  .classed("selectedRow",d => sel.includes(d["Name of Business or Organization"]))

  if(d3.selectAll('.cities.selected').data().length > 0){
    drawBar(d3.selectAll('.cities.selected').data(),false);
  }else{
    drawBar(circles.data());
  }


}

function brushend() {
  console.log("end");
}

function drawLegend(){
// Adds an SVG for the map's legend
var legend = svg
  .append("g")
  .attr("class", "legend")
  .attr("width", 140)
  .attr("height", 200)
  .selectAll("g")
  // Determine legend meaning from color attr
  .data([
    {'color': 'blue', 'label': 'States with SBN Memebers'},
    {'color': 'gray', 'label': 'States with No SBN Members'}
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
}


// Stuff for table
// Source: https://gist.github.com/jfreels/6814721
var tabulate = function (data,columns) {
  // TODO: fix this to place this correctly on the page
  var table = d3.select('.table-holder').append('table')
  var thead = table.append('thead')
  var tbody = table.append('tbody')

  thead.append('tr')
    .selectAll('th')
      .data(columns)
      .enter()
    .append('th')
      .text(function (d) { return d })

  var dragTarget = null;
  var hoverTarget = null;
  var htmlHover = null;
  var erase = false;

  var rows = tbody.selectAll('tr')
      .data(data)
      .enter()
    .append('tr')
    .on("mousedown",function(d) {
      let row = d3.select(this)
      console.log(event.target.parentNode)

      dragTarget = event.target.parentNode
      htmlHover = d3.select(hoverTarget);
      erase = !htmlHover.classed("selectedRow");
      htmlHover.classed("selectedRow",erase);
    })
    .on("mousemove",function(d){
       hoverTarget = event.target.parentNode;
       if(dragTarget){
          linkMap(tbody);
          if(dragTarget){
            d3.select(hoverTarget).classed("selectedRow",erase);
          }
       }
      
    })
    .on("mouseup",function(d){
      dragTarget = null;
      linkMap(tbody);
    })

  var cells = rows.selectAll('td')
      .data(function(row) {
        return columns.map(function (column) {
          return { column: column, value: row[column] }
        })
      })
      .enter()
    .append('td')
      .text(function (d) { 
        // Modified so if value is missing, "Unkown" is entered instead
        if (d.value == "") {
          return "Unkown"
        }

        return d.value })

  return table;
}

function linkMap(body) {

  se = []
  body.selectAll("tr.selectedRow").each(function(d,i){
    se.push(d["Name of Business or Organization"])
  })

  d3.selectAll("circle")
  .classed("selected", d => se.includes(d["Name of Business or Organization"]))

  d3.selectAll(".selected").raise()

  if(body.selectAll('tr.selectedRow').data().length > 0){
    drawBar(body.selectAll('tr.selectedRow').data(),false);
  }else{
    drawBar(clients);
  }
  
}
 
d3.csv('data/sbn-data-cleaned.csv', function (data) {
  var columns = ["Name of Business or Organization", "Industry", "Product or Service", "Address (City)", "Address (State)"];
  tabulate(data,columns);
})