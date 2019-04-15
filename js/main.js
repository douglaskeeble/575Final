	$(document).ready(function() {

		var coords = [34.0522, -118.2437, 10];
		var map = L.map('map', {
			center: [coords[0], coords[1]],
			zoom: coords[2],
			minZoom: 1,
			zoomControl: false
		});

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

		zoomButtons();


		d3.csv("/data/allCrimes.csv").then(function(data) {
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

		d3.csv("/data/burgalryOnly.csv").then(function(data) {
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

		d3.csv("/data/homicideOnly.csv").then(function(data) {
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

		d3.csv("/data/narcOnly.csv").then(function(data) {
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

		jqueryInit();

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
			$("#narcDialog").dialog({
				autoOpen: false
			});
			$("#burgDialog").dialog({
				autoOpen: false
			});
			$("#homDialog").dialog({
				autoOpen: false
			});

			$('.narcInfo').click(function() {
				$('#narcDialog').dialog('open');
			})
			$('.burgInfo').click(function() {
				$('#burgDialog').dialog('open');
			})
			$('.homInfo').click(function() {
				$('#homDialog').dialog('open');
			})

			$('.narc16').click(function() {
				if ($(this).hasClass('activeYear')) {
					$(this).toggleClass('activeYear');
					map.removeLayer(heatmapNarc);
					map.addLayer(heatmapAll);
					$('.all16').toggleClass('activeYear');
				} else {
					$(this).toggleClass('activeYear');
					map.eachLayer(function(layer) {
						if (!(layer._url ==
								'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png')) {
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
					map.addLayer(heatmapAll);
					$('.all16').toggleClass('activeYear');
				} else {
					$(this).toggleClass('activeYear');
					map.eachLayer(function(layer) {
						if (!(layer._url ==
								'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png')) {
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
					map.addLayer(heatmapAll);
					$('.all16').toggleClass('activeYear');
				} else {
					$(this).toggleClass('activeYear');
					map.eachLayer(function(layer) {
						if (!(layer._url ==
								'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
							)) {
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
								'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png')) {
							map.removeLayer(layer);
						}
					});
					heatmapAll.addTo(map);
					$('.hom16').removeClass('activeYear');
					$('.burg16').removeClass('activeYear');
					$('.narc16').removeClass('activeYear');
				}
			});
		}

	});
