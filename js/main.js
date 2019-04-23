$(document).ready(function() {

	$('.narcInfo').click(function() {
		$('#narcDialog').dialog('open');
	})
	$('.burgInfo').click(function() {
		$('#burgDialog').dialog('open');
	})
	$('.homInfo').click(function() {
		$('#homDialog').dialog('open');
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


	var heatAll = [];
	var heatNarc = [];
	var heatBurg = [];
	var heatHom = [];
	var heatmapAll;
	var heatmapBurg;
	var heatmapHom;
	var heatmapNarc;
	var props = [];
	var expressed;

	zoomButtons();


	d3.csv("data/allCrimes.csv").then(function(data) {
		data.forEach(function(d) {
			heatAll.push([d.Y, d.X]);
		});
		heatmapAll = L.heatLayer(heatAll, {
			gradient: {
				0.4: '#3490DC',
				0.65: '#FFED4A',
				1: '#F66D9B'
			}
		}).addTo(map);
	});

	d3.csv("data/burgalryOnly.csv").then(function(data) {
		data.forEach(function(d) {
			heatBurg.push([d.Y, d.X]);
		});
		heatmapBurg = L.heatLayer(heatBurg, {
			gradient: {
				0.4: '#3490DC',
				0.65: '#FFED4A',
				1: '#F66D9B'
			}
		});
	});

	d3.csv("data/homicideOnly.csv").then(function(data) {
		data.forEach(function(d) {
			heatHom.push([d.Y, d.X]);
		});
		heatmapHom = L.heatLayer(heatHom, {
			gradient: {
				0.4: '#3490DC',
				0.65: '#FFED4A',
				1: '#F66D9B'
			}
		});
	});

	d3.csv("data/narcOnly.csv").then(function(data) {
		data.forEach(function(d) {
			heatNarc.push([d.Y, d.X]);
		});
		heatmapNarc = L.heatLayer(heatNarc, {
			gradient: {
				0.4: '#3490DC',
				0.65: '#FFED4A',
				1: '#F66D9B'
			}
		});
	});

	createTopo();
	jqueryInit();

	function createTopo() {
		var csv;
		d3.csv("data/dem16.csv").then(function(data) {
			csv = data;
		});

		d3.json('data/dem16topo.json').then(function(data) {
			var svg = d3.select("#map").select("svg")
				.attr("pointer-events", "auto");

			var g = svg.select("g");

			d3.selectAll("g")
				.classed("dem16Layer", true);

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
			//join geoid of data and tracts
			for (prop in csvData[0]) {
				if (!(prop == 'CT10')) {
					props.push(prop)
				}
			}
			props.forEach(function(val) {
				$('#demSelect').append('<option value="' + val + '">' + val +
					'</option>');
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
			"#d0d1e6",
			"#a6bddb",
			"#67a9cf",
			"#1c9099",
			"#016c59",

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
		var tracts = d3.selectAll("path")
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

		$('.narc16').click(function() {
			if ($(this).hasClass('activeYear')) {
				$(this).toggleClass('activeYear');
				map.removeLayer(heatmapNarc);
			} else {
				$(this).toggleClass('activeYear');
				map.eachLayer(function(layer) {
					if (!(layer._url ==
							'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png') &&
						!(layer.options.clickable == true)) {
						map.removeLayer(layer);
					}
				});
				heatmapNarc.addTo(map);
				$('.hom16').removeClass('activeYear');
				$('.burg16').removeClass('activeYear');
				$('.all16').removeClass('activeYear');
			}
		});
		$('.hom16').click(function() {
			if ($(this).hasClass('activeYear')) {
				$(this).toggleClass('activeYear');
				map.removeLayer(heatmapHom);
			} else {
				$(this).toggleClass('activeYear');
				map.eachLayer(function(layer) {
					console.log(layer);
					if (!(layer._url ==
							'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png') &&
						!(layer.options.clickable == true)) {
						map.removeLayer(layer);
					}
				});
				heatmapHom.addTo(map);
				$('.narc16').removeClass('activeYear');
				$('.burg16').removeClass('activeYear');
				$('.all16').removeClass('activeYear');
			}
		});
		$('.burg16').click(function() {
			if ($(this).hasClass('activeYear')) {
				$(this).toggleClass('activeYear');
				map.removeLayer(heatmapBurg);
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
				heatmapBurg.addTo(map);
				$('.hom16').removeClass('activeYear');
				$('.narc16').removeClass('activeYear');
				$('.all16').removeClass('activeYear');
			}
		});
		$('.all16').click(function() {
			if ($(this).hasClass('activeYear')) {
				$(this).toggleClass('activeYear');
				map.removeLayer(heatmapAll);
			} else {
				$(this).toggleClass('activeYear');
				map.eachLayer(function(layer) {
					if (!(layer._url ==
							'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png') &&
						!(layer.options.clickable == true)) {
						map.removeLayer(layer);
					}
				});
				heatmapAll.addTo(map);
				$('.hom16').removeClass('activeYear');
				$('.burg16').removeClass('activeYear');
				$('.narc16').removeClass('activeYear');
			}
		});
		$('.dem16').click(function() {
			d3.selectAll("g")
				.classed("no-show", function(d, i) {
					return !d3.select(this).classed("no-show");
				});
			if ($(this).hasClass('activeYear')) {
				$(this).toggleClass('activeYear');
			} else {
				$(this).toggleClass('activeYear');
				$('.hom16').removeClass('activeYear');
				$('.burg16').removeClass('activeYear');
				$('.narc16').removeClass('activeYear');
				$('.all16').removeClass('activeYear');
			}
		});
	}

});
