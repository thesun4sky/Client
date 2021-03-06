goog.provide('openGDSMobile.MapVis');
goog.require('openGDSMobile.util.applyOptions');



/**
 * @constructor
 * @param {String} _mapDIV - 지도 DIV 객체
 * @param {Object} _options - 지도 관련 옵션 (JSON 객체)
 */
openGDSMobile.MapVis = function (_mapDIV, _options) {
    _options = (typeof (_options) !== 'undefined') ? _options : {};
    var defaultOptions = {
        lat: 37.582200,
        long: 127.010031,
        mapType: 'OSM',
        baseProj: 'EPSG:3857',
        zoom: 12,
        maxZoom : 18,
        minZoom : 5,
        list : null,
        attribute : null,
        indexedDB : true
    };

    /**
     * @type {boolean} GPS 객체
     * @private
     */
    this.geoLocation = false;

    var options = openGDSMobile.util.applyOptions(defaultOptions, _options);

    if (typeof (ol) === 'undefined') {
        console.error("Not Import OpenLayers 3 Library....");
        return -1;
    }

    var baseView = new ol.View({
        projection : ol.proj.get(options.baseProj),
        center : ol.proj.transform([options.long, options.lat], 'EPSG:4326', options.baseProj),
        zoom : options.zoom,
        maxZoom : options.maxZoom,
        minZoom : options.minZoom
    });
    var baseLayer = new ol.layer.Tile({
            title : 'backgroundMap',
            source : new ol.source.OSM(),
    });
    baseLayer.setZIndex(0);

    /**
     * @type {ol.Map} OpenLayers 지도 객체
     * @private
     */
    this.mapObj = new ol.Map({
        target : _mapDIV,
        layers : [baseLayer],
        view : baseView
    });
}

/**
 * 지도 객체 호출 함수
 * @returns {ol.Map} OpenLayers 3 지도 객체
 */
openGDSMobile.MapVis.prototype.getMapObj = function () {
    return this.mapObj;
};


/**
 * 텍스트 스타일 적용 함수
 * @private
 * @param {ol.Feature} feature  Vector 단위 객체
 * @param {Number} resolution 지도 해상도
 * @param {String }attrKey 속성정보 키값
 * @returns {ol.style.Text} OpenLayers 3 텍스트 스타일 객체
 */
openGDSMobile.MapVis.textStyleFunction = function (feature, resolution, attrKey) {
    return new ol.style.Text({
        text : resolution < 76 ? feature.get(attrKey) : ''
    });
};

/**
 * 스타일 적용 함수
 * @param {ol.Feature} feature  Vector 단위 객체
 * @param {Number} resolution 지도 해상도
 * @param {String} type 지도 타입(Polygon, Line, Point)
 * @param {Object} options 스타일 선 및 채우기 색상, 선 굵기, 속성 키 값 투명도  
 * @returns {ol.style.Style} OpenLayers 3 스타일 객체
 */
openGDSMobile.MapVis.styleFunction = function (feature, resolution, type, options) {
    if (type === 'polygon') {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: options.strokeColor,
                width: options.strokeWidth
            }),
            fill: new ol.style.Fill({
                color: options.fillColor
            }),
            text: openGDSMobile.MapVis.textStyleFunction(feature, resolution, options.attrKey)
        });
    } else if (type === 'line') {

    } else if (type === 'point') {
        return new ol.style.Style({
            image : new ol.style.Circle({
                radius : options.radius,
                stroke : new ol.style.Stroke({
                    color: options.strokeColor,
                    width: options.strokeWidth
                }),
                fill : new ol.style.Fill({
                    color : options.fillColor
                }),
                text: openGDSMobile.MapVis.textStyleFunction(feature, resolution, options.attrKey)
            })
        })
    }
}


/**
 * 배경지도 변경
 * @param {String} _mapType - 지도 스타일 이름 (OSM | VWorld)
 */
openGDSMobile.MapVis.prototype.changeBgMap = function (_mapType) {
    if (typeof (_mapType) === 'undefined' ) {
        console.error('Input map type parameter');
        return -1;
    }
    var bgMapLayers = this.mapObj.getLayers();
    var center = this.mapObj.getView().getCenter();
    var zoom = this.mapObj.getView().getZoom();
    var proj = this.mapObj.getView().getProjection();
    var bgMapLayer = null;
    bgMapLayers.forEach(function(_obj, _i){
        var title = _obj.get('title');
        if (title === 'backgroundMap') {
            bgMapLayer = _obj;
        }
    });
    var view = new ol.View({
        projection : proj,
        center : center,
        zoom : zoom,
        maxZoom : 18,
        minZoom : 5
    });
    this.mapObj.setView(view);
    if (_mapType === 'OSM') {
        bgMapLayer.setSource(new ol.source.OSM());
    } else if (_mapType === 'VWorld') {
        bgMapLayer.setSource(
            new ol.source.XYZ(({
                url : "http://xdworld.vworld.kr:8080/2d/Base/201310/{z}/{x}/{y}.png"
            }))
        );
    }
};


/**
 * 일반적인 지도 추가 함수
 * @param {Object}   _layerObj 레이어 객체
 * @param {String}      _type     레이어 타입 ('raster', 'image' ...)
 * @param {String}      _title    레이어 제목
 * @returns {*}
 */
openGDSMobile.MapVis.prototype.addLayer = function (_layerObj, _type, _title) {

    _layerObj.set('type', _type);
    _layerObj.set('title', _title);

    this.mapObj.addLayer(_layerObj);
    return _layerObj;
};


/**
 * GeoJSON 레이어 추가
 * @param {Object} _geoJSON 벡터 GeoJSON 객체
 * @param {String} _type 벡터 타입 (Point | Line | Polygon)
 * @param {String} _title 레이어 제목
 * @param {Object} _options 속성 값, 색상 채우기, 선 색상, 선 너비, 투명도 값 설정
 */
openGDSMobile.MapVis.prototype.addGeoJSONLayer = function (_geoJSON, _type, _title, _options) {
    _options = (typeof (_options) !== 'undefined') ? _options : {};
    var defaultOptions = {
        attrKey : null,
        fillColor : '#FFFFFF',
        strokeColor : '#000000',
        strokeWidth : 1,
        radius : 5,
        opt : 0.7
    };
    var options = openGDSMobile.util.applyOptions(defaultOptions, _options);

    
    var geoJSONLayer;
    geoJSONLayer = new ol.layer.Vector({
        title: _title,
        source : new ol.source.Vector({
            features : (new ol.format.GeoJSON()).readFeatures(_geoJSON)
        }),
        style : (function (feature, resolution) {
            return openGDSMobile.MapVis.styleFunction(feature, resolution, _type , options);
        })
    });
    geoJSONLayer.set('type', _type);
    geoJSONLayer.set('attrKey', options.attrKey);
    geoJSONLayer.set('fillColor', options.fillColor);
    geoJSONLayer.set('strokeColor', options.strokeColor);
    geoJSONLayer.set('strokeWidth', options.strokeWidth);
    geoJSONLayer.set('opt', options.opt);
    if (typeof (openGDSMobile.util.getOlLayer(this.mapObj, geoJSONLayer.get(_title))) === false) {
        console.error('Layer is not existence');
        return -1;
    }
    geoJSONLayer.setOpacity(options.opt);
    this.mapObj.addLayer(geoJSONLayer);

    ++openGDSMobile.geoJSONStatus.length;
    openGDSMobile.geoJSONStatus.objs.push({
        layerName : _title,
        attrKey : options.attrKey,
        type : _type,
        id : _geoJSON.features[0].id.split('.')[0],
        obj : _geoJSON
    });
    return geoJSONLayer;
};


/**
 * 벡터 스타일 변경
 * @param {String} _layerName - 시각화 된 레이어 제목
 * @param {Object} options - 옵션 JSON 객체 키 값 <br>
 *     {
 *       fillColor : '#FFFFFF',
 *       strokeColor : '#000000',
 *       radius : 5,
 *       strokeWidth : 1,
 *       opt : 0.7,
 *       attrKey : null,
 *       range : null,
 *       labelKey : null,
 *       valueKey : null,
 *       data : null
 *     }
 */
openGDSMobile.MapVis.prototype.changeVectorStyle = function (_layerName, _options) {
    _options = (typeof (_options) !== 'undefined') ? _options : {};
    var defaultOptions = {
        fillColor : '#FFFFFF',
        strokeColor : '#000000',
        radius : 5,
        strokeWidth : 1,
        opt : 0.7,
        attrKey : null,
        range : null,
        labelKey : null,
        valueKey : null,
        data : null
    }
    var styleCache = {};
    var layerObj = openGDSMobile.util.getOlLayer(this.mapObj, _layerName);
    if (typeof (layerObj) === false) {
        console.error('Layer is existence');
        return -1;
    }
    defaultOptions.attrKey = layerObj.get('attrKey');
    defaultOptions.fillColor = layerObj.get('fillColor');
    defaultOptions.strokeColor = layerObj.get('strokeColor');
    defaultOptions.strokeWidth = layerObj.get('strokeWidth');
    defaultOptions.opt = layerObj.get('opt');
    var type = layerObj.get('type');
    var options = openGDSMobile.util.applyOptions(defaultOptions, _options);

    layerObj.set('attrKey', options.attrKey);
    layerObj.set('fillColor', options.fillColor);
    layerObj.set('strokeColor', options.strokeColor);
    layerObj.set('strokeWidth', options.strokeWidth);
    
    layerObj.setStyle(function(feature, resolution){
        if (options.data === null) {
            return openGDSMobile.MapVis.styleFunction(feature, resolution, type, options);
        } else {
            var i, j;
            var tmpColor = '#FFFFFF';
            var text = resolution < 76 ? feature.get(options.attrKey) : '';
            if (!styleCache[text]){
                if (Array.isArray(options.fillColor)) {
                    for (i = 0; i < data.length; i += 1) {
                        if (text == data[i][options.labelKey]) {
                            for (j = 0; j < options.range.length; j += 1) {
                                if (data[i][options.valueKey] <= options.range[j]){
                                    tmpColor = options.fillColor[j];
                                }
                            }
                        }
                    }
                } else {
                    console.error('Color is not array.')
                }
                styleCache[text] = [openGDSMobile.MapVis.styleFunction(feature, resolution, type, options)];
            }
            return styleCache[text];
        }
    });
    layerObj.setOpacity(options.opt);
};

/**
 * 맵 레이어 삭제
 * @param {String} _layerName 레이어 제목
 */
openGDSMobile.MapVis.prototype.removeLayer = function (_layerName) {
    var layerObj = openGDSMobile.util.getOlLayer(this.mapObj, _layerName);
    if (typeof (layerObj) === false) {
        console.error('Layer is not existence');
        return -1;
    }
    this.mapObj.removeLayer(layerObj);
    //--openGDSMobile.geoJSONStatus;
    if (openGDSMobile.geoJSONStatus.removeContentLayerName(_layerName) != false){
        openGDSMobile.geoJSONStatus.length--;

    }

    //////////////////////////
    /*
     if (typeof (this.layerListObj) !== 'undefined') {
        this.layerListObj.removeList(layerName);
     }
     */
}



/**
 * 맵 레이어 시각화 여부
 * @param {String} _layerName - 레이어 이름
 * @param {Boolean} _flag - 시각화 값 설정 [true | false}
 */
openGDSMobile.MapVis.prototype.setVisible = function (_layerName, _flag) {
    var layerObj = openGDSMobile.util.getOlLayer(this.mapObj, _layerName);
    if (typeof (layerObj) === false) {
        console.error('Layer is not existence');
        return -1;
    }
    layerObj.setVisible(_flag);

};


/**
 * 이미지 레이어 시각화
 * @param {String} _imgURL 이미지 주소
 * @param {String} _imgTitle - 이미지 타이틀
 * @param {Object} _options - 옵션
 * {
 *       opt : 0.7,
 *       extent : [],       [lower left lon, lower left lat, upper right lon, upper right lat] or [left, bottom, right, top]
 *       size: [256,256]    [width, height]
 * }
 */
openGDSMobile.MapVis.prototype.addImageLayer = function (_imgUrl, _imgTitle, _options) {
    _options = (typeof (_options) !== 'undefined') ? _options : {};
    var defaultOptions = {
        opt : 0.7,
        extent : [],
        size: 256
    }
    var options = openGDSMobile.util.applyOptions(defaultOptions, _options);

    var imgLayer = new ol.layer.Image({
        opacity : options.opt,
        title : _imgTitle,
        source : new ol.source.ImageStatic({
            url : _imgUrl + '?' + Math.random(),
            imageSize : options.size,
            projection : this.mapObj.getView().getProjection(),
            imageExtent : options.extent
        })
    });

    this.mapObj.addLayer(imgLayer);
}


/**
 * 지도 GPS 트래킹
 * @param {Boolean} sw - Geolocation 설정
 **/
openGDSMobile.MapVis.prototype.trackingGeoLocation = function (_sw) {
    'use strict';
    var location = this.geoLocation
    if (location === null) {
        location = new ol.Geolocation({
            projection:	this.mapObj.getView().getProjection(),
            tracking : true
        });
    }
    if (sw === true) {
        location.once('change:position', function () {
            this.mapObj.getView().setCenter(location.getPosition());
        });
    } else {
        location.un('change:position');
    }
};


goog.exportSymbol('openGDSMobile.MapVis', openGDSMobile.MapVis);