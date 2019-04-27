var allCrimes = ["Alcohol Incidents", "Arson Incidents", "Assaults",
	"Burglaries", "Fed. Offenses", "Gambling", "Grand Theft Auto",
	"Homicides", "Mentally Ill", "Misc. Felonies", "Narcotics",
	"Robberies", "Sex Offenses", "Suicides", "Vagrancy Incidents",
	"Vandalism", "Vehicle Laws", "Weapon Laws", "Total Crimes"
];

$(document).ready(function() {

	$('.allcrimeInfo').click(function() {
		if ($('#allcrimeDialog').dialog('isOpen')) {
			$('#allcrimeDialog').dialog('close');
		} else {
			$('#allcrimeDialog').dialog('open');
		}
	})

	var dropDownChoices = ['Total Population', 'White', 'Black',
		'American Indian', 'Asian', 'Pacific Islander', 'Other',
		'Two or More', "Mean Income", 'Less than HS',
		'High School', 'Some College', "Bachelor's or Higher",
		"Alcohol Incidents", "Arson Incidents", "Assaults",
		"Burglaries", "Fed. Offenses", "Misc. Felonies", "Gambling",
		"Grand Theft Auto", 'Fraud',
		"Homicides", "Mentally Ill", "Narcotics",
		"Robberies", "Sex Offenses", "Suicides", "Vagrancy Incidents",
		"Vandalism", "Vehicle Laws", "Weapon Laws", "Total Crimes"
	]

	allCrimes.forEach(function(val) {
		dropDownChoices.push(val);
	})


	var coords = [34.0522, -118.2437, 10];
	var map = L.map('map', {
		center: [coords[0], coords[1]],
		zoom: coords[2],
		minZoom: 1,
		zoomControl: false
	});

	L.svg({
		clickable: true
	}).addTo(map);

	var basemap = L.tileLayer(
		'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		}).addTo(map);


	var heatAll16 = [];
	var heatNarc16 = [];
	var heatBurg16 = [];
	var heatHom16 = [];
	var props = [];
	var heatmapAll16 = L.heatLayer(),
		heatmapBurg16 = L.heatLayer(),
		heatmapHom16 = L.heatLayer(),
		heatmapNarc16 = L.heatLayer();
	var expressed;
	var classes = ['.hom16', '.burg16', '.all16', '.narc16'];
	var layerList = [{
		file: 'all16.csv',
		heat: heatAll16,
		heatmap: heatmapAll16,
		class: '.all16'
	}, {
		file: 'burg16.csv',
		heat: heatBurg16,
		heatmap: heatmapBurg16,
		class: '.burg16'
	}, {
		file: 'narc16.csv',
		heat: heatNarc16,
		heatmap: heatmapNarc16,
		class: '.narc16'
	}, {
		file: 'hom16.csv',
		heat: heatHom16,
		heatmap: heatmapHom16,
		class: '.hom16'
	}]

	layerList.forEach(function(element) {
		d3.csv("data/" + element.file, function(data) {
			data.forEach(function(d) {
				element.heat.push([d.Y, d.X]);
			});
			element.heatmap.setOptions({
				blur: 5,
				gradient: {
					// 0.4: '#a6611a',
					// 0.65: '#f5f5f5',
					// 1: '#80cdc1'
					0.4: '#810f7c',
					0.65: '#8c96c6',
					0.8: '#edf8fb',
					0.9: '#b3cde3'
				}
			});
			element.heatmap.setLatLngs(element.heat);
			if (element.heat == heatAll16) {
				element.heatmap.addTo(map);
			}
		});

	})

	zoomButtons();

	createTopo();
	jqueryInit();

	function createTopo() {
		var csv;
		d3.csv("data/dem16.csv", function(data) {
			csv = data;
		});

		d3.json('data/dem16topo.json', function(data) {
			var svg = d3.select("#map").select("svg")
				.attr("pointer-events", "auto");

			var g = svg.select("g")
				.classed("dem16Layer no-show", true);

			var topo = topojson.feature(data, data.objects.dem16).features;


			var joined = joinData(topo, csv);
			var colorScale = makeColorScale(csv);

			function projectPoint(x, y) {
				var point = map.latLngToLayerPoint(new L.LatLng(y, x));
				this.stream.point(point.x, point.y);
			};

			var transform = d3.geoTransform({
				point: projectPoint
			});

			var path = d3.geoPath().projection(transform);


			var feature = g.selectAll("path")
				.data(joined)
				.enter()
				.append("path")
				.attr("class", function(d) {
					return "tract ct" + d.properties.CT10;
				})
				.attr("d", path)
				.style("fill", function(d) {
					return choropleth(d.properties, colorScale);
				}).on("mouseover", function(d) {
					highlight(d.properties);
				})
				.on("mouseout", function(d) {
					dehighlight(d.properties);
				});
			var desc = feature.append("desc")
				.text('{"stroke-width": "0"}');

			map.on("moveend", update);

			update();

			function update() {
				feature.attr("d", path);
			}

		})

		//function to highlight enumeration units and bars
		function highlight(properties) {
			var selected = d3.selectAll(".ct" + properties.CT10)
				.style("stroke", "red")
				.style("stroke-width", "2");
			$('#infoBar').html(props[props.indexOf(expressed)] + ' ' + properties[
				expressed]);
			$('#infoBar').removeClass('no-show');
		};

		function dehighlight(properties) {
			var selected = d3.selectAll(".ct" + properties.CT10)
				.style("stroke-width", function() {
					return getStyle(this, "stroke-width")
				});
			$('#infoBar').empty();
			$('#infoBar').addClass('no-show');

			function getStyle(element, styleName) {
				var styleText = d3.select(element)
					.select("desc")
					.text();

				var styleObject = JSON.parse(styleText);

				return styleObject[styleName];
			};
		};


		function joinData(dem16, csvData, ) {

			for (prop in csvData[0]) {
				if (!(prop == 'CT10')) {
					props.push(prop)
				}
			}
			props.forEach(function(val, num) {
				$('#demSelect').append('<option value="' + val + '">' +
					dropDownChoices[num] +
					'</option>');
				if (num == 12) {
					$('#demSelect').append(
						'<option value="Crimes" disabled>Crimes</option>');
				}
			});

			$('#demSelect').change(function() {
				changeAttribute(this.value, csvData)
			})

			expressed = props[0];

			for (i = 0; i < csvData.length; i++) {
				var currTract = csvData[i];
				var csvKey = currTract.CT10;

				for (j = 0; j < dem16.length; j++) {
					var jsonProps = dem16[j].properties;
					var jsonKey = jsonProps.CT10;

					if (jsonKey == csvKey) {
						props.forEach(function(val) {
							jsonProps[val] = currTract[val]
						})
					}
				}
			}
			return dem16
		}
	}

	function makeColorScale(data) {
		var colorClasses = [
			"#ffffcc",
			"#c2e699",
			"#78c678",
			"#31a354",
			"#006837"
		];

		//create color scale generator
		var colorScale = d3.scaleThreshold()
			.range(colorClasses);

		//build array of all values of the expressed attribute
		var domainArray = [];
		for (var i = 0; i < data.length; i++) {
			var val = parseFloat(data[i][expressed]);
			domainArray.push(val);
		};

		//cluster data using ckmeans clustering algorithm to create natural breaks
		var clusters = ss.ckmeans(domainArray, 5);
		//reset domain array to cluster minimums
		domainArray = clusters.map(function(d) {
			return d3.min(d);
		});
		//remove first value from domain array to create class breakpoints
		domainArray.shift();

		//assign array of last 4 cluster minimums as domain
		colorScale.domain(domainArray);

		return colorScale;
	};

	//function to test for data value and return color
	function choropleth(props, colorScale) {
		//make sure attribute value is a number
		var val = parseFloat(props[expressed]);
		//if attribute value exists, assign a color; otherwise assign gray
		if (typeof val == 'number' && !isNaN(val)) {
			return colorScale(val);
		} else {
			return "#CCC";
		};
	};


	function changeAttribute(attribute, csvData) {
		//change the expressed attribute
		expressed = attribute;

		//recreate the color scale
		var colorScale = makeColorScale(csvData);

		//recolor enumeration units
		var tracts = d3.selectAll("g.dem16Layer path")
			.transition()
			.duration(1000)
			.style("fill", function(d) {
				return choropleth(d.properties, colorScale)
			});
	};

	function zoomButtons() {
		var zoom = L.control({
			position: 'topright'
		});

		zoom.onAdd = function(map) {
			var buttons = L.DomUtil.create('div', 'zoomButtons');
			var content = '<ul class="buttons">';
			content += '<li class="zoomIn"><i class="fas fa-plus"></i></li>';
			content += '<li class="home"><i class="fas fa-home"></i></li>';
			content += '<li class="zoomOut"><i class="fas fa-minus"></i></li>';
			content += '</ul>';
			$(buttons).append(content);
			return buttons;
		}
		zoom.addTo(map);
		$(".zoomIn").click(function() {
			map.zoomIn();
		});
		$(".home").click(function() {
			map.flyTo([coords[0], coords[1]], coords[2]);
		});
		$(".zoomOut").click(function() {
			map.zoomOut();
		});
	}

	function jqueryInit() {

		layerList.forEach(function(element) {
			$(element.class).click(function() {
				if ($(this).hasClass('activeYear')) {
					$(this).toggleClass('activeYear');
					map.removeLayer(element.heatmap);
				} else {
					$(this).toggleClass('activeYear');
					map.eachLayer(function(layer) {
						if (!(layer._url ==
								'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
							) &&
							!(layer.options.clickable == true)) {
							map.removeLayer(layer);
						}
					});
					element.heatmap.addTo(map);
					classes.forEach(function(selector) {
						if (!(selector == element.class)) {
							$(selector).removeClass('activeYear');
						}
					})
				}
			})
		})

		$('.dem16').click(function() {
			d3.selectAll("g.dem16Layer")
				.classed("no-show", function(d, i) {
					return !d3.select(this).classed("no-show");
				});
			$(this).toggleClass('activeYear');
		});
	}

});
