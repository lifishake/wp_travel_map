<?php
if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;
$table_name = $wpdb->prefix . 'travel_locations';
$locations = $wpdb->get_results("SELECT * FROM $table_name ORDER BY visit_date DESC");
?>

<?php
$mapbox_token = get_option('wptm_mapbox_token', '');
?>

<div class="wptm-admin-wrap">
    <h1 class="wptm-admin-title">旅行地图管理</h1>
    
    <?php if (empty($mapbox_token)): ?>
    <div class="wptm-setup-notice">
        <div class="wptm-notice-content">
            <h2>🚀 快速设置</h2>
            <p>开始使用前需要配置Mapbox访问令牌</p>
            <div class="wptm-quick-setup">
                <input type="text" id="wptm-quick-token" placeholder="输入你的Mapbox访问令牌 (pk.eyJ...)" />
                <button id="wptm-save-quick-token" class="button-primary">保存并开始使用</button>
                <a href="https://account.mapbox.com/access-tokens/" target="_blank" class="button">获取令牌</a>
            </div>
            <p class="wptm-help-text">
                <small>💡 令牌是免费的，每月有丰富的使用额度。保存后即可开始添加你的旅行地点！</small>
            </p>
        </div>
    </div>
    <?php endif; ?>
    
    <div class="wptm-import-export-bar">
        <button id="wptm-export-excel" class="wptm-btn wptm-btn-export">导出 Excel</button>
        <label for="wptm-import-file" class="wptm-btn wptm-btn-import">
            导入 Excel
            <input type="file" id="wptm-import-file" accept=".xlsx,.xls" style="display: none;">
        </label>
        <a href="#" id="wptm-download-template" class="wptm-btn wptm-btn-template">下载模板</a>
    </div>
    
    <div class="wptm-admin-container">
        <div class="wptm-admin-form">
            <h2>添加/编辑地点</h2>
            
            <div class="wptm-location-search">
                <label for="location-search">🔍 搜索地点</label>
                <div class="wptm-search-wrapper">
                    <div class="wptm-search-input-wrapper">
                        <input type="text" id="location-search" placeholder="输入地名，如：北京、东京塔、巴黎铁塔...">
                        <div class="wptm-search-spinner" style="display: none;">🔍</div>
                    </div>
                    <button type="button" id="wptm-search-btn" class="wptm-btn-search">精确搜索</button>
                </div>
                <div id="wptm-search-results"></div>
                <div class="wptm-search-tips">
                    <small>💡 输入时自动显示已保存地点，点击"精确搜索"查找新地点</small>
                </div>
            </div>
            
            <form id="wptm-location-form">
                <input type="hidden" id="location-id" value="">
                
                <div class="wptm-form-section">
                    <h3>📍 地点信息</h3>
                    
                    <div class="wptm-form-group">
                        <label for="location-name">地点名称 <span class="wptm-required">*</span></label>
                        <input type="text" id="location-name" required placeholder="如：北京天安门、东京塔">
                    </div>
                    
                    <div class="wptm-form-group">
                        <label for="location-description">描述或感想</label>
                        <textarea id="location-description" rows="3" placeholder="记录这个地方的特别之处或旅行感受..."></textarea>
                    </div>
                </div>
                
                <div class="wptm-form-section">
                    <h3>📅 访问时间</h3>
                    <div class="wptm-form-group">
                        <input type="date" id="location-date" placeholder="选择访问日期">
                    </div>
                </div>
                
                <div class="wptm-form-section wptm-coordinates-section">
                    <h3>🌍 坐标位置</h3>
                    <div class="wptm-form-row">
                        <div class="wptm-form-group">
                            <label for="location-latitude">纬度 <span class="wptm-required">*</span></label>
                            <input type="number" id="location-latitude" step="0.00000001" required readonly placeholder="通过搜索自动填充">
                        </div>
                        
                        <div class="wptm-form-group">
                            <label for="location-longitude">经度 <span class="wptm-required">*</span></label>
                            <input type="number" id="location-longitude" step="0.00000001" required readonly placeholder="通过搜索自动填充">
                        </div>
                    </div>
                    <p class="wptm-coord-hint"><small>💡 通过上方搜索功能自动获取坐标，也可以在地图上点击选择</small></p>
                </div>
                
                <div class="wptm-form-actions">
                    <button type="submit" class="wptm-btn wptm-btn-primary">
                        <span id="wptm-save-text">💾 保存地点</span>
                    </button>
                    <button type="button" id="wptm-cancel-edit" class="wptm-btn wptm-btn-secondary" style="display: none;">取消编辑</button>
                </div>
            </form>
            
            <div class="wptm-map-helper">
                <p>在地图上点击获取坐标</p>
                <div id="wptm-admin-map"></div>
            </div>
        </div>
        
        <div class="wptm-admin-list">
            <h2>已访问地点</h2>
            <div class="wptm-locations-list">
                <?php if (empty($locations)): ?>
                    <p class="wptm-no-locations">暂无地点记录</p>
                <?php else: ?>
                    <table class="wptm-locations-table">
                        <thead>
                            <tr>
                                <th>地点</th>
                                <th>日期</th>
                                <th>坐标</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($locations as $location): ?>
                                <tr data-location='<?php echo json_encode($location); ?>'>
                                    <td>
                                        <strong><?php echo esc_html($location->name); ?></strong>
                                        <?php if ($location->description): ?>
                                            <br><small><?php echo esc_html(mb_substr($location->description, 0, 50)); ?>...</small>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo $location->visit_date ? date('Y-m-d', strtotime($location->visit_date)) : '-'; ?></td>
                                    <td>
                                        <small><?php echo number_format($location->latitude, 6); ?>,<br>
                                        <?php echo number_format($location->longitude, 6); ?></small>
                                    </td>
                                    <td>
                                        <button class="wptm-edit-location" data-id="<?php echo $location->id; ?>">编辑</button>
                                        <button class="wptm-delete-location" data-id="<?php echo $location->id; ?>">删除</button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="wptm-shortcode-info">
        <h3>使用方法</h3>
        <p>在任何页面或文章中使用以下短代码显示地图：</p>
        <code>[travel_map height="600px" mapbox_token="your_mapbox_token"]</code>
        <p><small>请前往 <a href="https://www.mapbox.com/" target="_blank">Mapbox</a> 获取你的访问令牌</small></p>
    </div>
</div>