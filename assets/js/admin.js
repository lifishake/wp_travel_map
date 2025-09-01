jQuery(document).ready(function($) {
    
    if (typeof wptm_ajax === 'undefined') {
        console.error('WP Travel Map: AJAX object not loaded');
        return;
    }
    
    let map;
    let currentMarker;
    const mapboxToken = wptm_ajax.mapbox_token || '';
    
    // 快速设置功能
    $('#wptm-save-quick-token').on('click', function() {
        const token = $('#wptm-quick-token').val().trim();
        const $button = $(this);
        
        if (!token) {
            alert('请输入Mapbox访问令牌');
            return;
        }
        
        $button.prop('disabled', true).text('保存中...');
        
        $.post(wptm_ajax.ajax_url, {
            action: 'wptm_save_quick_token',
            nonce: wptm_ajax.nonce,
            token: token
        })
        .done(function(response) {
            if (response.success) {
                alert(response.data.message);
                location.reload(); // 刷新页面显示地图
            } else {
                alert('保存失败: ' + (response.data.message || '未知错误'));
                $button.prop('disabled', false).text('保存并开始使用');
            }
        })
        .fail(function() {
            alert('保存失败，请检查网络连接');
            $button.prop('disabled', false).text('保存并开始使用');
        });
    });
    
    // 快速设置中的回车键支持
    $('#wptm-quick-token').on('keypress', function(e) {
        if (e.which === 13) {
            $('#wptm-save-quick-token').click();
        }
    });
    
    $('#wptm-export-excel').on('click', function() {
        $.post(wptm_ajax.ajax_url, {
            action: 'wptm_export_excel',
            nonce: wptm_ajax.nonce
        }, function(response) {
            if (response.success && response.data) {
                exportToExcel(response.data);
            } else {
                alert('导出失败');
            }
        });
    });
    
    $('#wptm-import-file').on('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                const locations = jsonData.map(row => ({
                    name: row['地点名称'] || row['Name'] || '',
                    description: row['描述'] || row['Description'] || '',
                    latitude: parseFloat(row['纬度'] || row['Latitude']) || 0,
                    longitude: parseFloat(row['经度'] || row['Longitude']) || 0,
                    visit_date: formatDate(row['访问日期'] || row['Visit Date'] || '')
                }));
                
                if (confirm(`准备导入 ${locations.length} 个地点，是否继续？`)) {
                    importLocations(locations);
                }
            } catch (error) {
                alert('文件读取失败，请确保是有效的Excel文件');
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
        
        $(this).val('');
    });
    
    $('#wptm-download-template').on('click', function(e) {
        e.preventDefault();
        downloadTemplate();
    });
    
    function exportToExcel(locations) {
        const exportData = locations.map(loc => ({
            '地点名称': loc.name,
            '描述': loc.description || '',
            '纬度': parseFloat(loc.latitude),
            '经度': parseFloat(loc.longitude),
            '访问日期': loc.visit_date || ''
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '旅行地点');
        
        const colWidths = [
            { wch: 20 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
        ];
        ws['!cols'] = colWidths;
        
        const fileName = `travel_locations_${new Date().getTime()}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
    
    function importLocations(locations) {
        $.post(wptm_ajax.ajax_url, {
            action: 'wptm_import_excel',
            nonce: wptm_ajax.nonce,
            locations: JSON.stringify(locations)
        }, function(response) {
            if (response.success) {
                alert(response.data.message);
                if (response.data.success_count > 0) {
                    location.reload();
                }
            } else {
                alert('导入失败: ' + (response.data.message || '未知错误'));
            }
        });
    }
    
    function downloadTemplate() {
        const templateData = [
            {
                '地点名称': '北京',
                '描述': '中国首都，历史文化名城',
                '纬度': 39.9042,
                '经度': 116.4074,
                '访问日期': '2024-01-15'
            },
            {
                '地点名称': '上海',
                '描述': '国际大都市',
                '纬度': 31.2304,
                '经度': 121.4737,
                '访问日期': '2024-02-20'
            }
        ];
        
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '模板');
        
        const colWidths = [
            { wch: 20 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 }
        ];
        ws['!cols'] = colWidths;
        
        XLSX.writeFile(wb, 'travel_locations_template.xlsx');
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '';
        
        if (typeof dateStr === 'number') {
            const date = XLSX.SSF.parse_date_code(dateStr);
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    $('#wptm-search-btn').on('click', function() {
        searchLocation();
    });
    
    $('#location-search').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            searchLocation();
        }
    });
    
    let searchTimeout;
    $('#location-search').on('input', function() {
        const query = $(this).val().trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(function() {
                showSearchSuggestions(query);
            }, 300);
        } else {
            $('#wptm-search-results').html('');
        }
    });
    
    function showSearchSuggestions(query) {
        $.post(wptm_ajax.ajax_url, {
            action: 'wptm_search_suggestions',
            nonce: wptm_ajax.nonce,
            query: query
        })
        .done(function(response) {
            if (response.success && response.data && response.data.length > 0) {
                displayDatabaseSuggestions(response.data);
            } else {
                $('#wptm-search-results').html('');
            }
        })
        .fail(function(xhr, status, error) {
            console.log('Search suggestions failed (non-critical):', error);
            $('#wptm-search-results').html('');
        });
    }
    
    function displayDatabaseSuggestions(suggestions) {
        let html = '<div class="wptm-suggestions-header">已保存的地点：</div>';
        suggestions.forEach(function(suggestion) {
            html += '<div class="wptm-search-result wptm-db-suggestion" data-result=\'' + JSON.stringify(suggestion) + '\'>';
            html += '<span class="wptm-search-result-name">' + escapeHtml(suggestion.name) + '</span>';
            html += '<span class="wptm-search-result-coords">' + parseFloat(suggestion.latitude).toFixed(4) + ', ' + parseFloat(suggestion.longitude).toFixed(4) + '</span>';
            html += '<span class="wptm-suggestion-type">已保存</span>';
            html += '</div>';
        });
        $('#wptm-search-results').html(html);
        
        $('.wptm-db-suggestion').on('click', function() {
            const result = $(this).data('result');
            selectSearchResult({
                name: result.name,
                latitude: parseFloat(result.latitude),
                longitude: parseFloat(result.longitude)
            });
        });
    }
    
    function searchLocation() {
        const query = $('#location-search').val().trim();
        if (!query) {
            showSearchMessage('请输入地点名称', 'warning');
            return;
        }
        
        if (query.length < 2) {
            showSearchMessage('搜索关键词至少需要2个字符', 'warning');
            return;
        }
        
        showSearchMessage('正在搜索地点...', 'loading');
        $('.wptm-search-spinner').show();
        
        $.post(wptm_ajax.ajax_url, {
            action: 'wptm_geocode_search',
            nonce: wptm_ajax.nonce,
            query: query
        })
        .done(function(response) {
            $('.wptm-search-spinner').hide();
            console.log('Geocode search response:', response);
            
            if (response.success && response.data && response.data.length > 0) {
                displaySearchResults(response.data, true);
            } else {
                const errorMsg = response.data && response.data.message ? response.data.message : '未找到匹配的地点';
                showSearchMessage(errorMsg, 'error');
            }
        })
        .fail(function(xhr, status, error) {
            $('.wptm-search-spinner').hide();
            console.error('Geocode search failed:', error, xhr.responseText);
            
            let errorMessage = '搜索请求失败';
            if (xhr.status === 401) {
                errorMessage = 'Mapbox访问令牌无效，请检查设置';
            } else if (xhr.status === 403) {
                errorMessage = 'Mapbox访问被拒绝，请检查令牌权限';
            } else if (xhr.status === 0) {
                errorMessage = '网络连接失败，请检查网络';
            }
            
            showSearchMessage(errorMessage, 'error');
        });
    }
    
    function showSearchMessage(message, type) {
        let className = '';
        let icon = '';
        
        switch (type) {
            case 'loading':
                className = 'color: #666; background: #f9f9f9;';
                icon = '🔍 ';
                break;
            case 'error':
                className = 'color: #d00; background: #fff2f2; border: 1px solid #fcc;';
                icon = '❌ ';
                break;
            case 'warning':
                className = 'color: #f80; background: #fffaf0; border: 1px solid #fed;';
                icon = '⚠️ ';
                break;
            case 'success':
                className = 'color: #0a0; background: #f0fff0; border: 1px solid #cfc;';
                icon = '✅ ';
                break;
            default:
                className = 'color: #666;';
        }
        
        $('#wptm-search-results').html('<div style="padding: 10px; ' + className + '">' + icon + message + '</div>');
    }
    
    function showSuccessMessage(message) {
        const $form = $('#wptm-location-form');
        const $success = $('<div class="wptm-success-message">✅ ' + message + '</div>');
        $success.css({
            'background': '#d4edda',
            'color': '#155724',
            'padding': '12px 16px',
            'border': '1px solid #c3e6cb',
            'border-radius': '6px',
            'margin-bottom': '20px'
        });
        
        $form.prepend($success);
        
        setTimeout(function() {
            $success.fadeOut(500, function() {
                $(this).remove();
            });
        }, 2000);
    }
    
    function resetForm() {
        $('#wptm-location-form')[0].reset();
        $('#location-id').val('');
        $('#location-latitude, #location-longitude').prop('readonly', true).css('background', '#f5f5f5');
        $('#wptm-cancel-edit').hide();
        $('#wptm-search-results').html('');
        $('#location-search').val('');
        
        if (currentMarker) {
            currentMarker.remove();
            currentMarker = null;
        }
    }
    
    function displaySearchResults(results, isGeocoding = false) {
        let html = '';
        if (isGeocoding) {
            html += '<div class="wptm-suggestions-header">地理搜索结果：</div>';
        }
        
        results.forEach(function(result) {
            html += '<div class="wptm-search-result wptm-geocode-result" data-result=\'' + JSON.stringify(result) + '\'>';
            html += '<span class="wptm-search-result-name">' + escapeHtml(result.name) + '</span>';
            html += '<span class="wptm-search-result-coords">' + result.latitude.toFixed(4) + ', ' + result.longitude.toFixed(4) + '</span>';
            if (isGeocoding) {
                html += '<span class="wptm-suggestion-type">新地点</span>';
            }
            html += '</div>';
        });
        $('#wptm-search-results').html(html);
        
        $('.wptm-geocode-result').on('click', function() {
            const result = $(this).data('result');
            selectSearchResult(result);
        });
    }
    
    function selectSearchResult(result) {
        $('#location-name').val(result.name);
        $('#location-latitude').val(result.latitude.toFixed(8)).prop('readonly', false);
        $('#location-longitude').val(result.longitude.toFixed(8)).prop('readonly', false);
        
        if (map && typeof mapboxgl !== 'undefined') {
            try {
                const lat = result.latitude;
                const lng = result.longitude;
                
                map.flyTo({
                    center: [lng, lat],
                    zoom: 12
                });
                
                if (currentMarker) {
                    currentMarker.remove();
                }
                
                currentMarker = new mapboxgl.Marker({
                    color: '#000000'
                })
                .setLngLat([lng, lat])
                .addTo(map);
            } catch (error) {
                console.error('WP Travel Map: Error updating map marker', error);
            }
        }
        
        $('#wptm-search-results').html('<div style="padding: 10px; color: #0a0;">已选择：' + escapeHtml(result.name) + '</div>');
        $('#location-search').val('');
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
    
    function initMap() {
        if (typeof mapboxgl === 'undefined') {
            console.error('WP Travel Map: Mapbox GL JS not loaded');
            return;
        }
        
        const $mapDiv = $('#wptm-admin-map');
        if (!$mapDiv.length) {
            return;
        }
        
        if (!mapboxToken) {
            console.error('WP Travel Map: No Mapbox token available');
            $mapDiv.html('<div style="padding: 20px; color: #d00; text-align: center; border: 1px solid #ddd; background: #fafafa;">⚠️ 需要配置Mapbox访问令牌<br><small>请前往"设置"页面配置令牌</small></div>');
            return;
        }
        
        mapboxgl.accessToken = mapboxToken;
        
        const mapProjection = wptm_ajax.map_projection || 'globe';
        
        try {
            const mapConfig = {
                container: 'wptm-admin-map',
                style: 'mapbox://styles/mapbox/light-v11',
                center: [116.3974, 39.9093],
                zoom: 2,
                antialias: true
            };
            
            // 根据投影设置配置地图
            if (mapProjection !== 'globe') {
                mapConfig.projection = mapProjection;
            }
            
            map = new mapboxgl.Map(mapConfig);
            
            console.log('WP Travel Map: Admin map initialized with projection:', mapProjection);
            
            map.on('load', function() {
                console.log('WP Travel Map: Admin map loaded successfully');
            });
            
            map.on('error', function(e) {
                console.error('WP Travel Map: Map error', e);
                let errorMessage = '地图加载失败';
                
                if (e.error && e.error.message) {
                    if (e.error.message.includes('401')) {
                        errorMessage = '❌ Mapbox访问令牌无效<br><small>请检查令牌是否正确</small>';
                    } else if (e.error.message.includes('403')) {
                        errorMessage = '❌ Mapbox访问被拒绝<br><small>请检查令牌权限</small>';
                    }
                }
                
                $mapDiv.html('<div style="padding: 20px; color: #d00; text-align: center; border: 1px solid #ddd; background: #fafafa;">' + errorMessage + '</div>');
            });
            
        } catch (error) {
            console.error('WP Travel Map: Failed to initialize admin map', error);
            let errorMessage = '地图初始化失败';
            
            if (error.message && error.message.includes('401')) {
                errorMessage = '❌ Mapbox访问令牌无效<br><small>请检查令牌是否正确或已过期</small>';
            }
            
            $mapDiv.html('<div style="padding: 20px; color: #d00; text-align: center; border: 1px solid #ddd; background: #fafafa;">' + errorMessage + '</div>');
            return;
        }
        
        map.on('click', function(e) {
            const lat = e.lngLat.lat;
            const lng = e.lngLat.lng;
            
            $('#location-latitude').val(lat.toFixed(8)).prop('readonly', false);
            $('#location-longitude').val(lng.toFixed(8)).prop('readonly', false);
            
            if (currentMarker) {
                currentMarker.remove();
            }
            
            currentMarker = new mapboxgl.Marker({
                color: '#000000'
            })
            .setLngLat([lng, lat])
            .addTo(map);
        });
    }
    
    if ($('#wptm-admin-map').length) {
        initMap();
    }
    
    $('#wptm-location-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'wptm_save_location',
            nonce: wptm_ajax.nonce,
            id: $('#location-id').val(),
            name: $('#location-name').val(),
            description: $('#location-description').val(),
            latitude: $('#location-latitude').val(),
            longitude: $('#location-longitude').val(),
            visit_date: $('#location-date').val()
        };
        
        $('#wptm-save-text').text('保存中...');
        $('button[type="submit"]').prop('disabled', true);
        
        $.post(wptm_ajax.ajax_url, formData, function(response) {
            $('#wptm-save-text').text('💾 保存地点');
            $('button[type="submit"]').prop('disabled', false);
            
            if (response.success) {
                showSuccessMessage('地点保存成功！');
                resetForm();
                setTimeout(function() {
                    location.reload();
                }, 1000);
            } else {
                alert('保存失败: ' + (response.data.message || '未知错误'));
            }
        })
        .fail(function() {
            $('#wptm-save-text').text('💾 保存地点');
            $('button[type="submit"]').prop('disabled', false);
            alert('保存失败，请检查网络连接');
        });
    });
    
    $('.wptm-edit-location').on('click', function() {
        const $row = $(this).closest('tr');
        const locationData = $row.data('location');
        
        $('#location-id').val(locationData.id);
        $('#location-name').val(locationData.name);
        $('#location-description').val(locationData.description);
        $('#location-latitude').val(locationData.latitude);
        $('#location-longitude').val(locationData.longitude);
        $('#location-date').val(locationData.visit_date);
        
        if (map) {
            const lat = parseFloat(locationData.latitude);
            const lng = parseFloat(locationData.longitude);
            
            map.flyTo({
                center: [lng, lat],
                zoom: 10
            });
            
            if (currentMarker) {
                currentMarker.remove();
            }
            
            currentMarker = new mapboxgl.Marker({
                color: '#000000'
            })
            .setLngLat([lng, lat])
            .addTo(map);
        }
        
        $('html, body').animate({
            scrollTop: $('#wptm-location-form').offset().top - 50
        }, 500);
    });
    
    $('.wptm-delete-location').on('click', function() {
        if (!confirm('确定要删除这个地点吗？')) {
            return;
        }
        
        const locationId = $(this).data('id');
        
        $.post(wptm_ajax.ajax_url, {
            action: 'wptm_delete_location',
            nonce: wptm_ajax.nonce,
            id: locationId
        }, function(response) {
            if (response.success) {
                alert('地点删除成功');
                location.reload();
            } else {
                alert('删除失败: ' + (response.data.message || '未知错误'));
            }
        });
    });
    
    $('#wptm-cancel-edit').on('click', function() {
        $('#wptm-location-form')[0].reset();
        $('#location-id').val('');
        
        if (currentMarker) {
            currentMarker.remove();
            currentMarker = null;
        }
    });
    
    $('#location-latitude, #location-longitude').on('change', function() {
        const lat = parseFloat($('#location-latitude').val());
        const lng = parseFloat($('#location-longitude').val());
        
        if (!isNaN(lat) && !isNaN(lng)) {
            if (currentMarker) {
                currentMarker.remove();
            }
            
            currentMarker = new mapboxgl.Marker({
                color: '#000000'
            })
            .setLngLat([lng, lat])
            .addTo(map);
            
            map.flyTo({
                center: [lng, lat],
                zoom: 10
            });
        }
    });
});