$(document).ready(function() {
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  var allYears = ["2005", "2006", "2007", "2008", "2009", "2010", "2011",
    "2012", "2013", "2014", "2015", "2016"
  ];
  var firstExpressed = allCrimes[0],
    secondExpressed = allCrimes[1],
    width = (window.innerWidth * .57),
    height = (window.innerHeight * .57),
    firstBubble = allYears[0];

  //functions
  createBubbleDropdown(width, height);
  loadBubble(width, height, firstBubble);
  lineGraph(firstExpressed, width, height);
  createLineDropdown(width, height);
  groupedBars()

  function createBubbleDropdown(width, height) {
    //add select element
    var dropdown = d3.select("#menuHolder")
      .append("select")
      .attr("class", "dropdown")
      .on("change", function() {
        loadBubble(width, height, this.value)
      });

    //add initial option
    var titleOption = dropdown.append("option")
      .attr("class", "titleOption")
      .attr("disabled", "true")
      .text("Select Year");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
      .data(allYears)
      .enter()
      .append("option")
      .attr("value", function(d) {
        return d
      })
      .text(function(d) {
        return d
      });
  };

  function loadBubble(width, height, attribute) {

    var margin = {
        top: 20,
        right: 10,
        bottom: 100,
        left: 10
      },
      width = width - margin.left - margin.right,
      height = height - margin.top - margin.bottom

    var t = d3.transition()
      .duration(1000);

    d3.select(".bubbleChart")
      .remove();

    var svg = d3.select("#bubbleHolder").append("svg")
      .attr("class", "bubbleChart")
      .attr("width", 650)
      .attr("height", 450);

    // Define the div for the tooltip
    var div = d3.select("#bubbleHolder").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    var pack = d3.pack()
      .size([500, 450])
      .padding(1.5);



    d3.csv("data/data2.csv", function(d) {
      d.value = +d[attribute];
      d.Crime = d["Crime"]

      return d;
    }, function(error, data) {
      if (error) throw error;


      //set color of bubble chart
      var myColor = d3.scaleOrdinal()
        .domain(data.map(function(d) {
          return d.Crime;
        }))
        .range(["#78c679", "#41ab5d", "#238443", "#006837", "#00552d",
          "#004529", "#002214"
        ]);

      var root = d3.hierarchy({
          children: data
        })
        .sum(function(d) {
          return d.value;
        })
        .sort(function(a, b) {
          return -(a.value - b.value); //this organizes the chart so larges is in center. Removing sort function makes it sort randomly
        });

      var node = svg.selectAll(".node")
        .data(pack(root).leaves())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });


      node.append("circle")
        .attr("id", function(d) {
          return d.id;
        })
        .attr("r", function(d) {
          return d.r;
        })
        .style("fill", function(d) {
          return myColor(d.data.Crime);
        })
        .on("mouseover", function(d) {
          div.transition()
            .duration(200)
            .style("opacity", .8);

          var duration = 300;
          data.forEach(function(d, i) {
            //console.log(d.value);
            node.transition().duration(duration).delay(i *
                duration)
              .attr("r", d.value);
          });

          div.html(d.data.Crime + ": " + numberWithCommas(d.data.value))
            .style("left", (d3.event.clientX - 500) + "px")
            .style("top", (d3.event.clientY - 250) + "px")
            .style("font-family", "Avenir", "sans-serif");
        })
        .on("mouseout", function(d) {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });

      node.append("text")
        .style("text-anchor", "middle")
        .transition(t)
        .text(function(d) {
          //if you don't want some of the circles populated with text, specify constraints below
          if (d.data.value > 748 || d.data.Crime == "Other" || d.data
            .Crime == "Fire") {
            return d.data.Crime;
          }
          return "";
        })
        .attr("font-size", function(d) {
          return d.r / 5;
        })
        .attr("fill", "#e4e4e4")
        .style("font-family", "Avenir", "sans-serif")
        .style("letter-spacing", "1px")
        .style("font-weight", "bold");


    });
  }; //end loadBubble


  function createLineDropdown(width, height) {
    //add select element
    var dropdown = d3.select("#linebuttonHolder")
      .append("select")
      .attr("class", "dropdown")
      .on("change", function() {
        updateLine(this.value, 300, 850)
      });

    //add initial option
    var titleOption = dropdown.append("option")
      .attr("class", "titleOption")
      .attr("disabled", "true")
      .text("Select Crime");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
      .data(allCrimes)
      .enter()
      .append("option")
      .attr("value", function(d) {
        return d
      })
      .text(function(d) {
        return d
      });
  };

  function updateLine(attribute, width, height) {
    d3.select(".lineChart")
      .remove();
    var attr = attribute;
    lineGraph(attr, width, height);
  } //close updateLine

  //lineGraph function does not work with callback. If you use callback, you can only run the function once, any subsequent runs do not work
  function lineGraph(attribute, width, height) {
    var expressed = attribute;
    var myColor = d3.scaleOrdinal()
      .domain(allCrimes)
      .range(["#78c679", "#41ab5d", "#238443", "#006837", "#00552d",
        "#004529", "#002214"
      ]);

    var margin = {
        top: 20,
        right: 200,
        bottom: 100,
        left: 50
      },
      width = width - margin.left - margin.right,
      height = height - 100 - margin.bottom,
      tooltip = {
        width: 100,
        height: 100,
        x: 10,
        y: -30
      };

    var parseDate = d3.timeParse("%m/%e/%Y"),
      bisectDate = d3.bisector(function(d) {
        return d.date;
      }).left,
      formatValue = d3.format(","),
      dateFormatter = d3.timeFormat("%Y");

    var x = d3.scaleTime()
      .range([0, width]);

    var y = d3.scaleLinear()
      .range([height, 0]);

    var svg = d3.select("#lineHolder").append("svg")
      .attr("class", "lineChart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top +
        ")");


    var line = d3.line()
      .x(function(d) {
        return x(d.date);
      })
      .y(function(d) {
        return y(d[expressed]);
      });

    d3.csv("data/data.csv", function(error, data) {
      if (error) throw error;

      data.forEach(function(d) {
        d.date = parseDate(d.date);
        d[expressed] = +d[expressed];
      });

      data.sort(function(a, b) {
        return a.date - b.date;
      });

      x.domain([data[0].date, data[data.length - 1].date]);
      y.domain(d3.extent(data, function(d) {
        return d[expressed];
      }));

      svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Number of" + expressed);

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
          .tickFormat(dateFormatter));

      svg.append('g').select("path")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1)

      d3.selectAll("line")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1)

      svg.append("path")
        .datum(data)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .attr("class", "line")
        .attr("d", line)
        .attr("stroke", function(d) {
          return myColor("Total Crimes")
        })
        .style("stroke-width", "3px");

      var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

      focus.append("circle")
        .attr("r", 5);

      focus.append("rect")
        .attr("class", "tooltip")
        .attr("width", 200)
        .attr("height", 50)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

      focus.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 18)
        .attr("y", -2);

      focus.append("text")
        .attr("class", "tooltip-name")
        .attr("x", 18)
        .attr("y", 18)
        .text(expressed + ":");

      focus.append("text")
        .attr("class", "tooltip-crime")
        .attr("x", 150)
        .attr("y", 18);

      svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() {
          focus.style("display", null);
        })
        .on("mouseout", function() {
          focus.style("display", "none");
        })
        .on("mousemove", mousemove);

      function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
          i = bisectDate(data, x0, 1),
          d0 = data[i - 1],
          d1 = data[i],
          d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.date) + "," + y(d[
          expressed]) + ")");

        focus.select(".tooltip-date").text(dateFormatter(d.date));
        focus.select(".tooltip-crime").text(formatValue(d[expressed]))
      }; //mousemove close
    })
  }; // lineGraph close

  //groupedBars chart
  function groupedBars() {

    var data = [{
        "area": "Antellope Valley",
        "stats": [234872, 58748, 2404, 15939, 778, 75517, 19717, 68877,
          7776, 7205, 19097, 1542, 951, 117, 3511, 2022, 63, 341, 1385,
          5, 1277, 21, 775, 1969, 4414, 412, 218, 6, 2001, 3178, 538
        ]
      }, {
        "area": "East",
        "stats": [856195, 59773, 9002, 179520, 4353, 422500, 46767, 69241,
          27218, 27509, 84533, 10028, 1646, 129, 4878, 3918, 97, 747,
          2851, 19, 5100, 67, 851, 5112, 13640, 901, 104, 122, 3842,
          5850, 1056
        ]
      }, {
        "area": "Metro",
        "stats": [692360, 69543, 9397, 223782, 2103, 342703, 46240, 73063,
          23433, 21453, 57619, 19855, 791, 20, 3821, 382, 148, 189, 558,
          0, 504, 7, 265, 1041, 2418, 261, 304, 15, 968, 1130, 305
        ]
      }, {
        "area": "San Fernando",
        "stats": [1519700, 85191, 9763, 260276, 3018, 332340, 92641,
          94244, 28087, 34602, 108063, 24381, 861, 32, 2824, 1324, 151,
          255, 1730, 0, 683, 7, 577, 1338, 4156, 297, 151, 20, 1212,
          1844, 248
        ]
      }, {
        "area": "San Gabriel Valley",
        "stats": [858743, 69522, 11212, 536292, 4208, 372796, 68131,
          86866, 21073, 29109, 100800, 20903, 842, 85, 2504, 3469, 73,
          346, 2131, 0, 1961, 25, 679, 3092, 6789, 509, 127, 104, 1985,
          3823, 401
        ]
      },

      {
        "area": "South",
        "stats": [450301, 319302, 8196, 36972, 2583, 450731, 28669, 50230,
          32145, 24587, 74856, 8414, 848, 159, 4513, 1910, 60, 458,
          1082, 13, 3549, 92, 476, 2958, 7488, 945, 95, 152, 2337, 3697,
          996
        ]
      }, {
        "area": "South Bay",
        "stats": [819567, 276700, 14700, 240154, 12743, 276432, 99308,
          80689, 25022, 27350, 82962, 14769, 787, 89, 2948, 1888, 123,
          341, 1499, 1, 2273, 49, 416, 2805, 7116, 499, 59, 40, 1898,
          3454, 715
        ]
      },

      {
        "area": "West",
        "stats": [570986, 63157, 4559, 99725, 1340, 39910, 41237, 141391,
          4622, 10221, 47785, 19233, 278, 11, 618, 477, 104, 99, 414, 0,
          243, 4, 134, 239, 1612, 94, 20, 5, 391, 724, 42
        ]
      }

    ];

    var ids = ['white', 'black', 'amerInd', 'asian', 'pacIsl', 'other',
      'twoRac', 'income', 'lessHS', 'HSgrad', 'somColl', 'BAhigher',
      'alcohol', 'arson', 'assault', 'burglary', 'feddOff', 'felonMisc',
      'fraud', 'gamble', 'gta', 'homicide', 'mental', 'narcotic',
      'robbery', 'sexOff', 'suicide', 'vagrancy', 'vandal', 'vehicBoat',
      'weapon'
    ];
    var demVar = ['White', 'Black', 'American Indian', 'Asian',
      'Pacific Islander', 'Other Race', 'Two or More Races',
      'Avg. Mean Income', 'Less than HS Degree', 'High School Degree',
      'Some College', 'BA or Higher', 'Alcohol Rel.', 'Arson', 'Assault',
      'Burglaries', 'Federal Off.', 'Felon Misc.', 'Fraud', 'Gambling',
      'Grand Theft Auto', 'Homicide', 'Mentally Ill', 'Narcotics',
      'Robberies', 'Sex Offense', 'Suicide', 'Vagrancy', 'Vandalism',
      'VehicBoat Laws', 'Weapon Laws'
    ];

    // Let's populate the categoeries checkboxes
    d3.select('.categories').selectAll('.checkbox')
      .data(ids)
      .enter()
      .append('div')
      .attr('class', 'checkbox')
      .attr("transform", function(d, i) {
        return "translate(" + (i % 2 * 150 + 10) + "," + (Math.floor(i /
          2) * 20 + 10) + ")"
      })
      .append('label').html(function(id, index) {
        var checkbox = '<input id="' + id +
          '" type="checkbox" class="category">';
        return checkbox + demVar[index];
      });

    // some variables declarations
    var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 95
      },
      width = 1000 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

    // the scale for the area value
    var x = d3.scaleLinear()
      .rangeRound([0, width]);

    // the scale for each state
    var y0 = d3.scaleBand()
      .rangeRound([0, height], .2);

    // the scale for each region
    var y1 = d3.scaleBand();

    // just a simple scale of colors
    var color = d3.scaleOrdinal()
      .range(['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99',
        '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99',
        '#b15928',
        '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
        '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f',
        '#737373', '#ae017e', '#00441b', '#ce1256', '#253494', '#800026',
        '#35978f'
      ])
      // .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00", "#ca0020","#f4a582","#d5d5d5"]);

    //
    var xAxis = d3.axisBottom()
      .scale(x)
      .tickFormat(d3.format(".2s"));

    var yAxis = d3.axisLeft()
      .scale(y0);

    var svg = d3.select(".graph").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr('class', 'regionGraph')
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top +
        ")");

    d3.select('.categories').selectAll('.category').on('change', function() {
      var x = d3.select('.categories').selectAll('.category:checked');
      //console.log("x>>>>>>>>>>>>>>", x._groups)
      var ids = [];
      for (var i = 0; i < x._groups[0].length; i++) {
        ids = [...ids, x._groups[0][i].id]
        console.log(x._groups[0][i])
      }
      //                console.log('>>>>>>>>>>>>>>>>>>>>>>', ids)
      updateGraph(ids);
    });

    renderGraph();

    function renderGraph() {
      x.domain([0, 0]);
      // y0 domain is all the state names
      y0.domain(data.map(function(d) {
        return d.area;
      }));
      // y1 domain is all the region names, we limit the range to from 0 to a y0 band
      y1.domain(demVar).rangeRound([0, y0.bandwidth()]);

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
    }

    function updateGraph(selectedIds) {

      var areasData = data.map(function(areaData) {
        return {
          area: areaData.area,
          attributes: selectedIds.map(function(selectedId) {
            var index = ids.findIndex(function(id) {
              return selectedId === id;
            });
            return {
              id: ids[index],
              name: demVar[index],
              value: areaData.stats[index]
            };
          })
        }

      });


      // x domain is between 0 and the maximun value in any regions.value
      x.domain([0, d3.max(areasData, function(d) {
        return d3.max(d.attributes, function(d) {
          return d.value
        });
      })]);
      // y0 domain is all the region names
      y0.domain(areasData.map(function(d) {
        return d.area;
      }));
      // y1 domain is all the region names, we limit the range to from 0 to a y0 band
      y1.domain(ids).rangeRound([0, y0.bandwidth()]);

      svg.selectAll('.axis.x').call(xAxis);
      svg.selectAll('.axis.y').call(yAxis);

      var area = svg.selectAll(".area")
        .data(areasData);

      area.enter().append("g")
        .attr("class", "area")
        .attr("transform", function(d) {
          return "translate(0, " + y0(d.area) + ")";
        });

      var attribute = area.selectAll("rect")
        .data(function(d) {
          return d.attributes;
        });

      // we append a new rect every time we have an extra data vs dom element
      attribute.enter().append("rect")
        .attr('width', 0);

      // this updates will happend neither inserting new elements or updating them
      attribute
        .attr("x", 0)
        .attr("y", function(d, index) {
          return y1(ids[index]);
        })
        .attr("id", function(d) {
          return d.id;
        })
        .style("fill", function(d) {
          return color(d.name);
        })
        .text(function(d) {
          return d.name
        })
        .transition()
        .attr("width", function(d) {
          return x(d.value);
        })
        .attr("height", y1.bandwidth());

      attribute.exit().transition().attr("width", 0).remove();

      svg.selectAll(".legend").remove();
      var legend = svg.append("g")
        .attr('class', 'legend')
        .attr("font-size", 10)
        // .attr("text-anchor", "end")
        .selectAll("g")
        .data(areasData[0].attributes.map(function(attribute) {
          return attribute.name;
        }))
        .enter().append("g")
        .attr("transform", function(d, i) {
          return "translate(-70," + (200 + i * 20) + ")";
        });

      legend.append("rect")
        .attr("x", width - 50)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

      //append legend texts
      legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        // .style("text-anchor", "end")
        .text(function(d) {
          return d;
        });
    }
  } //groupedBars close
});
