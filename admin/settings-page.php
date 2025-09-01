<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wptm-settings-wrap">
    <h1 class="wptm-admin-title">地图设置</h1>
    
    <form method="post" action="options.php" class="wptm-settings-form">
        <?php settings_fields('wptm_settings_group'); ?>
        
        <div class="wptm-settings-section">
            <h2>Mapbox 配置</h2>
            
            <div class="wptm-form-group">
                <label for="wptm_mapbox_token">Mapbox 访问令牌</label>
                <div class="wptm-token-input-wrapper">
                    <input type="text" 
                           id="wptm_mapbox_token" 
                           name="wptm_mapbox_token" 
                           value="<?php echo esc_attr(get_option('wptm_mapbox_token', '')); ?>" 
                           placeholder="pk.eyJ1I..." />
                    <button type="button" id="wptm-test-token" class="button">测试令牌</button>
                </div>
                <div id="wptm-token-status"></div>
                <p class="description">
                    前往 <a href="https://account.mapbox.com/access-tokens/" target="_blank">Mapbox Account</a> 获取你的访问令牌。
                    <strong>必须配置有效令牌才能正常使用地图功能。</strong>
                </p>
            </div>
            
            <div class="wptm-form-group">
                <label for="wptm_default_map_style">默认地图样式</label>
                <select id="wptm_default_map_style" name="wptm_default_map_style">
                    <?php
                    $current_style = get_option('wptm_default_map_style', 'mapbox://styles/mapbox/light-v11');
                    $styles = array(
                        'mapbox://styles/mapbox/light-v11' => '浅色（推荐）',
                        'mapbox://styles/mapbox/dark-v11' => '深色',
                        'mapbox://styles/mapbox/streets-v12' => '街道',
                        'mapbox://styles/mapbox/satellite-v9' => '卫星',
                        'mapbox://styles/mapbox/satellite-streets-v12' => '卫星街道'
                    );
                    foreach ($styles as $value => $label) {
                        printf(
                            '<option value="%s" %s>%s</option>',
                            esc_attr($value),
                            selected($current_style, $value, false),
                            esc_html($label)
                        );
                    }
                    ?>
                </select>
                <p class="description">选择地图的默认显示样式</p>
            </div>
            
            <div class="wptm-form-group">
                <label for="wptm_map_projection">地图投影</label>
                <select id="wptm_map_projection" name="wptm_map_projection">
                    <?php
                    $current_projection = get_option('wptm_map_projection', 'globe');
                    $projections = array(
                        'globe' => '🌍 3D球形地图（默认）',
                        'mercator' => '🗺️ 平面地图（Mercator投影）',
                        'equalEarth' => '🌎 平面地图（Equal Earth投影）',
                        'naturalEarth' => '🌏 平面地图（Natural Earth投影）'
                    );
                    foreach ($projections as $value => $label) {
                        printf(
                            '<option value="%s" %s>%s</option>',
                            esc_attr($value),
                            selected($current_projection, $value, false),
                            esc_html($label)
                        );
                    }
                    ?>
                </select>
                <p class="description">选择地图投影方式。3D球形适合展示全球视图，平面地图更适合查看详细信息。</p>
            </div>
        </div>
        
        <div class="wptm-settings-section">
            <h2>使用说明</h2>
            
            <div class="wptm-usage-info">
                <h3>快速开始</h3>
                <ol>
                    <li>获取并填写你的 Mapbox 访问令牌</li>
                    <li>在"旅行地图"页面添加你的旅行地点</li>
                    <li>使用短代码 <code>[travel_map]</code> 在任何页面显示地图</li>
                </ol>
                
                <h3>短代码参数</h3>
                <pre><code>[travel_map height="600px"]</code></pre>
                
                <h3>地点搜索</h3>
                <p>在添加地点时，直接输入地名（如"北京"、"东京塔"）即可自动搜索并获取坐标。</p>
            </div>
        </div>
        
        <?php submit_button('保存设置'); ?>
    </form>
</div>

<style>
.wptm-settings-wrap {
    max-width: 800px;
    margin: 20px 20px 20px 0;
}

.wptm-settings-form {
    background: #fff;
    padding: 30px;
    margin-top: 20px;
}

.wptm-settings-section {
    margin-bottom: 40px;
}

.wptm-settings-section h2 {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
}

.wptm-form-group {
    margin-bottom: 25px;
}

.wptm-form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.wptm-form-group input[type="text"],
.wptm-form-group select {
    width: 100%;
    max-width: 500px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    font-size: 14px;
}

.wptm-form-group .description {
    margin-top: 8px;
    color: #666;
    font-size: 13px;
}

.wptm-usage-info {
    background: #f9f9f9;
    padding: 20px;
    border-left: 3px solid #000;
}

.wptm-usage-info h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 20px 0 10px 0;
}

.wptm-usage-info h3:first-child {
    margin-top: 0;
}

.wptm-usage-info ol {
    margin: 10px 0;
    padding-left: 20px;
}

.wptm-usage-info code,
.wptm-usage-info pre {
    background: #fff;
    padding: 2px 6px;
    border: 1px solid #ddd;
    font-family: 'Courier New', monospace;
}

.wptm-usage-info pre {
    padding: 10px;
    margin: 10px 0;
}

.wptm-token-input-wrapper {
    display: flex;
    gap: 10px;
    align-items: center;
}

.wptm-token-input-wrapper input {
    flex: 1;
}

#wptm-token-status {
    margin-top: 10px;
    padding: 10px;
    border-radius: 3px;
    display: none;
}

#wptm-token-status.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    display: block;
}

#wptm-token-status.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    display: block;
}

#wptm-token-status.loading {
    background: #e2e3e5;
    color: #383d41;
    border: 1px solid #d6d8db;
    display: block;
}
</style>

<script>
jQuery(document).ready(function($) {
    $('#wptm-test-token').on('click', function() {
        const token = $('#wptm_mapbox_token').val().trim();
        const $status = $('#wptm-token-status');
        const $button = $(this);
        
        if (!token) {
            $status.removeClass('success error loading').addClass('error')
                   .html('❌ 请先输入访问令牌').show();
            return;
        }
        
        $button.prop('disabled', true).text('测试中...');
        $status.removeClass('success error').addClass('loading')
               .html('🔍 正在验证令牌...').show();
        
        // 通过创建地图实例来测试token
        if (typeof mapboxgl !== 'undefined') {
            mapboxgl.accessToken = token;
            
            try {
                const testMap = new mapboxgl.Map({
                    container: document.createElement('div'),
                    style: 'mapbox://styles/mapbox/light-v11',
                    center: [0, 0],
                    zoom: 1
                });
                
                testMap.on('load', function() {
                    $status.removeClass('loading error').addClass('success')
                           .html('✅ 令牌验证成功！可以正常访问Mapbox服务');
                    $button.prop('disabled', false).text('测试令牌');
                    testMap.remove();
                });
                
                testMap.on('error', function(e) {
                    let errorMsg = '❌ 令牌验证失败';
                    if (e.error && e.error.message) {
                        if (e.error.message.includes('401')) {
                            errorMsg = '❌ 令牌无效或已过期';
                        } else if (e.error.message.includes('403')) {
                            errorMsg = '❌ 令牌权限不足';
                        }
                    }
                    
                    $status.removeClass('loading success').addClass('error')
                           .html(errorMsg);
                    $button.prop('disabled', false).text('测试令牌');
                    testMap.remove();
                });
                
            } catch (error) {
                $status.removeClass('loading success').addClass('error')
                       .html('❌ 令牌格式错误或无法连接到Mapbox服务');
                $button.prop('disabled', false).text('测试令牌');
            }
        } else {
            // 如果Mapbox库未加载，通过API请求测试
            $.ajax({
                url: 'https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=' + encodeURIComponent(token),
                method: 'GET',
                timeout: 10000
            })
            .done(function() {
                $status.removeClass('loading error').addClass('success')
                       .html('✅ 令牌验证成功！');
                $button.prop('disabled', false).text('测试令牌');
            })
            .fail(function(xhr) {
                let errorMsg = '❌ 令牌验证失败';
                if (xhr.status === 401) {
                    errorMsg = '❌ 令牌无效或已过期';
                } else if (xhr.status === 403) {
                    errorMsg = '❌ 令牌权限不足';
                }
                
                $status.removeClass('loading success').addClass('error')
                       .html(errorMsg);
                $button.prop('disabled', false).text('测试令牌');
            });
        }
    });
});
</script>