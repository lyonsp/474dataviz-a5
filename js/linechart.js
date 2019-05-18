'use strict';
(function() {

  let data = "no data";
  let svgLineGraph = ""; // keep SVG reference in global scope
  let svgScatterPlot = "";
  let div = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData;
        makeLineGraph(data, 'AUS');
        svgScatterPlot = div
          .append('svg')
          .attr('width', 500)
          .attr('height', 500);
      });
  }

  function makeLineGraph(csvData, location) {
    data = csvData;

    var startData = data.filter((row) => row["location"] == location);
    let yearData = startData.map((row) => +row["time"]);
    let lifeExpectancyData = startData.map((row) => row["life_expectancy"]);

    let minMaxData = findMinMax(yearData, lifeExpectancyData);
    let funcs = drawAxes(minMaxData, "time", "life_expectancy", svgLineGraph);

    plotLineGraph(funcs, startData);

    lineGraphLabels();

    // create empty array
    // loop through every country and add country if doesn't already exist
    let countries = [];
    
    for (let i = 0; i < data.length; i++) {
      let currCountry = data[i]["location"];
      if (!countries.includes(currCountry)) {
        countries.push(currCountry)
      }
    }

    // create dropdown to select country
    let dropBox = d3.select('body').append('select')
      .attr('name', 'year-list');

    var options = dropBox.selectAll('option')
      .data(countries)
      .enter()
      .append('option')
      .html(countries);

    options.text(function(d) {return d;})
      .attr('value', function(d) {return d;});

    dropBox.on("change", function() {
        d3.selectAll("svg > *").remove();
        var selected = this.value;
        var selectedData = data.filter(function(d) {
          return d.location == selected;
        });
        yearData = selectedData.map((row) => parseFloat(row["time"]));
        lifeExpectancyData = selectedData.map((row) => parseFloat(row["life_expectancy"]));
        minMaxData = findMinMax(yearData, lifeExpectancyData);
        funcs = drawAxes(minMaxData, "time", "life_expectancy", svgLineGraph);
        plotLineGraph(funcs, selectedData);
        lineGraphLabels();
        });
  }

  function plotLineGraph(funcs, countryData) {
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));

    div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    svgLineGraph.append("path")
      .datum(countryData)
      .attr("fill", "white")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecapt", "round")
      .attr("d", line)
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", 1)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
        makeScatterPlot();
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  // make scatter plot
  function makeScatterPlot() {
    svgScatterPlot.html("");

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot);

    plotData(mapFunctions);

    // draw title and axes labels
    scatterPlotLabels();

  }

  // make title and axes labels for line graph
  function lineGraphLabels() {
    svgLineGraph.append('text')
      .attr('x', 120)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Population Size Over Time");

    svgLineGraph.append('text')
      .attr('x', 250)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population (in millions)');
  }
  // make title and axes labels for scatter plot
  function scatterPlotLabels() {
    svgScatterPlot.append('text')
      .attr('x', 120)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Fertility Rate by Life Expectancy");

    svgScatterPlot.append('text')
      .attr('x', 225)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rate');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy');
  }

  // plot all the data points on the SVG
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // append data to SVG and plot as points
    svgScatterPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', 3)
        .attr('fill', "#4286f4");
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax])
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin])
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

})();
