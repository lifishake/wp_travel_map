jQuery(document).ready(function($) {
    
    const $mapContainer = $('#wptm-frontend-map');
    
    if ($mapContainer.length === 0) {
        return;
    }
    
    if (typeof mapboxgl === 'undefined') {
        console.error('WP Travel Map: Mapbox GL JS not loaded');
        $mapContainer.html('<div style="padding: 20px; color: #999; text-align: center;">地图加载失败</div>');
        return;
    }
    
    if (typeof wptm_ajax === 'undefined') {
        console.error('WP Travel Map: AJAX object not loaded');
        return;
    }
    
    // 优先使用配置的token，然后是短代码的token，最后是默认token
    const mapboxToken = wptm_ajax.mapbox_token || $mapContainer.data('mapbox-token') || '';
    const mapStyle = wptm_ajax.map_style || 'mapbox://styles/mapbox/light-v11';
    const mapProjection = wptm_ajax.map_projection || 'globe';
    
    if (!mapboxToken) {
        console.error('WP Travel Map: No Mapbox token configured');
        $mapContainer.html('<div style="padding: 20px; color: #d00; text-align: center; border: 1px solid #ddd; background: #fafafa;">⚠️ 需要配置Mapbox访问令牌<br><small>请前往"旅行地图 > 设置"页面配置令牌</small></div>');
        return;
    }
    
    mapboxgl.accessToken = mapboxToken;
    
    let map;
    try {
        const mapConfig = {
            container: 'wptm-frontend-map',
            style: mapStyle,
            center: [0, 20],
            zoom: 2,
            maxZoom: 18,
            minZoom: 1,
            antialias: true
        };
        
        // 根据投影设置配置地图
        if (mapProjection !== 'globe') {
            mapConfig.projection = mapProjection;
        }
        
        map = new mapboxgl.Map(mapConfig);
        
        console.log('WP Travel Map: Map initialized successfully with projection:', mapProjection);
        
    } catch (error) {
        console.error('WP Travel Map: Failed to initialize frontend map', error);
        let errorMessage = '地图初始化失败';
        
        if (error.message && error.message.includes('401')) {
            errorMessage = '❌ Mapbox访问令牌无效<br><small>请检查令牌是否正确或已过期</small>';
        } else if (error.message && error.message.includes('403')) {
            errorMessage = '❌ Mapbox访问被拒绝<br><small>请检查令牌权限设置</small>';
        }
        
        $mapContainer.html('<div style="padding: 20px; color: #d00; text-align: center; border: 1px solid #ddd; background: #fafafa;">' + errorMessage + '</div>');
        return;
    }
    
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }), 'top-left');
    
    map.addControl(new mapboxgl.FullscreenControl(), 'top-left');
    
    function loadLocations() {
        $.post(wptm_ajax.ajax_url, {
            action: 'wptm_get_locations'
        }, function(response) {
            if (response.success && response.data) {
                displayLocations(response.data);
            }
        });
    }
    
    function displayLocations(locations) {
        const bounds = new mapboxgl.LngLatBounds();
        let hasLocations = false;
        
        locations.forEach(function(location) {
            const lat = parseFloat(location.latitude);
            const lng = parseFloat(location.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                return;
            }
            
            hasLocations = true;
            bounds.extend([lng, lat]);
            
            const el = document.createElement('div');
            el.className = 'wptm-marker';
            
            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,
                className: 'wptm-popup'
            });
            
            let popupContent = '<div class="wptm-popup-content">';
            popupContent += '<h3 class="wptm-popup-title">' + escapeHtml(location.name) + '</h3>';
            
            if (location.visit_date && location.visit_date !== '0000-00-00') {
                const date = new Date(location.visit_date);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                popupContent += '<div class="wptm-popup-date">' + date.toLocaleDateString('zh-CN', options) + '</div>';
            }
            
            if (location.description) {
                const descriptionWithLinks = makeLinksClickable(escapeHtml(location.description));
                popupContent += '<p class="wptm-popup-description">' + descriptionWithLinks + '</p>';
            }
            
            popupContent += '<div class="wptm-popup-coords">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</div>';
            popupContent += '</div>';
            
            popup.setHTML(popupContent);
            
            new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map);
        });
        
        if (hasLocations && locations.length > 1) {
            map.fitBounds(bounds, {
                padding: 50,
                maxZoom: 12
            });
        } else if (hasLocations && locations.length === 1) {
            const firstLocation = locations[0];
            map.flyTo({
                center: [parseFloat(firstLocation.longitude), parseFloat(firstLocation.latitude)],
                zoom: 10
            });
        }
        
        if (locations.length > 0) {
            addLegend(locations.length);
        }
    }
    
    function addLegend(count) {
        const legend = document.createElement('div');
        legend.className = 'wptm-map-legend';
        legend.innerHTML = `
            <div class="wptm-legend-title">旅行统计</div>
            <div class="wptm-legend-item">
                <span class="wptm-legend-marker"></span>
                <span>已访问 ${count} 个地点</span>
            </div>
        `;
        $mapContainer.append(legend);
    }
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    function makeLinksClickable(text) {
        if (!text) return '';
        
        // URL正则表达式，匹配http/https链接
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
        
        return text.replace(urlRegex, function(url) {
            // 移除末尾的标点符号
            const cleanUrl = url.replace(/[.,;:!?]+$/, '');
            const punctuation = url.substr(cleanUrl.length);
            
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="wptm-link">${cleanUrl}</a>${punctuation}`;
        });
    }
    
    map.on('load', function() {
        loadLocations();
    });
    
    map.on('style.load', function() {
        map.setFog({
            'range': [0.8, 8],
            'color': '#ffffff',
            'horizon-blend': 0.05
        });
    });
});