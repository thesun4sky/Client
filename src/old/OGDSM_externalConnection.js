/*global $, jQuery, ol, OGDSM*/
OGDSM.namesapce('externalConnection');
(function (OGDSM) {
    'use strict';
    /**
     * 외부 데이터 접속 요청 객체
     * @class OGDSM.externalConnection
     * @constructor
     */
    OGDSM.externalConnection = function () {

    };
    OGDSM.externalConnection.prototype = {
        constructor : OGDSM.externalConnection
    };
    return OGDSM.externalConnection;
}(OGDSM));

/**
 * 폼 타입 에이젝스 요청
 * @param {String} addr - 서버 주소
 * @param {String} formID - form ID
 * @param {String} submitID - 전송 버튼 아이디<input type="button">
 * @param {function} callback - 콜백 함수 function (resultData) {...}
 */
OGDSM.externalConnection.prototype.formAjaxRequest = function (addr, formID, submitBtnID, callback) {
    'use strict';
    $('#' + submitBtnID).click(function () {
        var formData = $('#' + formID).serialize();
        console.log(formData);
        $.mobile.loading('show', {
            text : 'Loading',
            textVisible : 'true',
            theme : 'c',
            textonlt : 'false'
        });
        $.ajax({
            type : 'POST',
            url : addr,
            cache : false,
            data : formData,
            success : function (msg) {
                callback(msg);
            },
            error : function (e) {
                console.log(e);
            }
        });
    });
};

/**
 * JSON 기반 에이젝스 요청
 * @param {String} addr - 서버 주소
 * @param {Object} options - 콜백 함수 function (resultData) {...}
 *
 *
 *
 */
OGDSM.externalConnection.prototype.ajaxRequest = function (addr, options) {
    'use strict';
    options = (typeof (options) !== 'undefined') ? options : {};
    var defaults = {
        data : null,
        submitBtn : null,
        callback : function (data) { console.log("Please create callback function"); }
    };
    defaults = OGDSM.applyOptions(defaults, options);
    function ajax() {
        $.mobile.loading('show', {
            text : 'Loading',
            textVisible : 'true',
            theme : 'c',
            textonlt : 'false'
        });
        $.ajax({
            type : 'POST',
            url : addr,
            cache : false,
            data : JSON.stringify(defaults.data),
            contentType : 'application/json;charset=UTF-8',
            dataType : 'json',
            success : function (msg) {
                defaults.callback(msg);
                $.mobile.loading('hide');
            },
            error : function (e) {
                //console.log(e);
                console.log("OpenGDS Mobile Log : Server Error");
                $.mobile.loading('hide');
            }
        });
    }

    if (defaults.submitBtn !== null) {
        $('#' + defaults.submitBtn).click(function () {
            ajax();
        });
    } else {
        ajax();
    }
};

/**
 * GeoServer WFS 데이터 요청 (OpenLayers3 ol.source.GeoJSON)
 * @param {Object} obj - OpenGDS Mobile 시각화 객체
 * @param {String} addr - 주소
 * @param {String} workspace - 워크스페이스
 * @param {String} layerName - 레이어 이름
 * @param {Object} options - 옵션 JSON 객체 키 값<br>
  {color:'rgba(0, 0, 0, 0.0)', callback:function () {}}<br>
    <ul>
        <li>color(String) : 색상 rgba</li>
        <li>label(String) : 라벨<br></li>
        <li>callback(Function) : 콜백 함수 function (resultData) {...}</li>
    </ul>
 */
OGDSM.externalConnection.prototype.geoServerGeoJsonLoad = function (obj, addr, workspace, layerName, options) {
    'use strict';
    options = (typeof (options) !== 'undefined') ? options : {};
    console.log(layerName);
    var fullAddr = addr + '/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeNames=' + workspace + ':' +
        layerName.split('--')[0] + '&outputFormat=json&srsname=' + obj.baseProj;
    var objStyles, name;
    console.log(fullAddr);
    var defaults = {
        color : 'rgba(0, 0, 0, 0.0)',
        label : null,
        callback : function (wfslayer) {}
    };
    defaults = OGDSM.applyOptions(defaults, options);
    $.mobile.loading('show', {
        text : 'Loading',
        textVisible : 'true',
        theme : 'c',
        textonlt : 'false'
    });
    layerName = layerName.replace(/[ \{\}\[\]\/?.,;:|\)*~`!\+┼<>@\#$%&\'\"\\\(\=]/gi);
    $.ajax({
        type : 'POST',
        url : fullAddr,
        crossDomain: true,
        dataType : 'json',
        success : function (msg) {
            var wfsLayer = new ol.layer.Vector({
                title : layerName,
                source : new ol.source.Vector({
                    features : (new ol.format.GeoJSON()).readFeatures(msg)
                }),
                style : (function () {
                    var styleFill = new ol.style.Fill({
                        color : defaults.color
                    });
                    var styleStroke = new ol.style.Stroke({
                        color : 'rgba(0, 0, 0, 1.0)',
                        width : 1
                    });
                    var styleCircle = new ol.style.Circle({
                        radius : 10,
                        fill : styleFill,
                        stroke : styleStroke
                    });
                    return function (feature, resolution) {
                        var type = feature.getGeometry().getType();
                        var styleText = null;
                        if (defaults.label !== null) {
                            styleText = new ol.style.Text({
                                font : '12px Calibri, sans-serif',
                                text : feature.get(defaults.label),
                                fill : new ol.style.Fill({
                                    color : '#000'
                                }),
                                stroke : new ol.style.Stroke({
                                    color : '#fff',
                                    width : 3
                                })
                            });
                            feature.set('label', defaults.label);
                        }
                        //console.log(defaults.label);
                        feature.set('styleFill', styleFill);
                        feature.set('styleStroke', styleStroke);
                        feature.set('styleCircle', styleCircle);
                        feature.set('styleText', styleText);
                        if (type === 'MultiPolygon') {
                            return [new ol.style.Style({
                                fill : styleFill,
                                stroke : styleStroke,
                                text : styleText
                            })];
                        } else if (type === 'Point') {
                            return [new ol.style.Style({
                                image : styleCircle,
                                text : styleText
                            })];
                        }
                    };
                }())
            });
            wfsLayer.set('styleFill', defaults.color);
            obj.addMap(wfsLayer, defaults.type);
            $.mobile.loading('hide');
            defaults.callback(wfsLayer);
        },
        error : function (e) {
            console.log(e);
            $.mobile.loading('hide');
        }
    });
};
/**
 * VWorld WMS 데이터 요청
 * @param {String} apiKey - API 키
 * @param {String} domain - 도메인
 * @param {String} data - WMS 레이어 이름
 * @return {ol.layer.Tile} OpenLayers 타일 객체
 */
OGDSM.externalConnection.prototype.vworldWMSLoad = function (apiKey, domain, data) {
    'use strict';
    data = data.join(',');
    console.log(data);
    var resultData = new ol.layer.Tile({
        title : 'VWorldWMS',
        source : new ol.source.TileWMS(({
            url : 'http://map.vworld.kr/js/wms.do',
            params : {
                apiKey : apiKey,
                domain : domain,
                LAYERS : data,
                STYLES : data,
                FORMAT : 'image/png',
                CRS : 'EPSG:900913',
                EXCEPTIONS : 'text/xml',
                TRANSPARENT : true
            }
        }))
    });
    return resultData;
};

/**
 * 공공 데이터 요청 인터페이스
 * @param {String} addr - 어플리케이션 서버 요청 주소
 * @param {Object} jsonData - 데이터 요청 파라미터 {serviceName : ??(필수), serviceKey ??(필수), ...}
 * @param {function} callback - 콜백 함수 function (resultData) {...}
 *
 */
OGDSM.externalConnection.prototype.publicDataInterface = function (addr, jsonData, callback) {
    'use strict';
    $.mobile.loading('show', {
        text : 'Loading',
        textVisible : 'true',
        theme : 'c',
        textonlt : 'false'
    });
    console.log(JSON.stringify(jsonData));
    $.ajax({
        type : 'POST',
        url : addr,
        data : JSON.stringify(jsonData),
        contentType : "application/json;charset=UTF-8",
        dataType : 'json',
        success : function (jsonResult) {
            $.mobile.loading('hide');
            if (jsonResult.result === 'OK') {
                callback(JSON.parse(jsonResult.data));
            } else {
                alert("데이터를 불러오는데 실패하였습니다");
            }
        },
        error : function (error) {
            $.mobile.loading('hide');
            console.error(error);
        }
    });
};


/**
 * 서울 열린 데이터 광장 환경 데이터 요청
 * @param {String} addr - 주소
 * @param {String} apiKey - api 키
 * @param {String} envType - 환경 정보 이름
 * @param {date} date - 날짜 (YYYYMMDD)
 * @param {time} time - 시간 (HH00)
 * @param {function} callback - 콜백 함수 function (resultData) {...}
 */
OGDSM.externalConnection.prototype.seoulEnvironmentLoad = function (addr, apiKey, envType, date, time, callback) {
    'use strict';
    var jsonData = {};
    jsonData.serviceKey = apiKey;
    jsonData.returnType = 'json';
    jsonData.serviceName = 'TimeAverageAirQuality';
    jsonData.amount = '1/100';
    jsonData.dateTimeValue = date + time;
    jsonData.envType = envType;
    this.publicDataInterface(addr, jsonData, function (resultData) {
        callback(resultData);
    });
};


/**
 * 데이터 포털 환경 데이터 요청
 * @param {String} addr - 주소
 * @param {String} apiKey - API 키
 * @param {String} envType - 환경 정보 이름
 * @param {String} area - 지역
 * @param {function} callback - 콜백 함수 function (resultData) {...}
 */
OGDSM.externalConnection.prototype.dataPortalEnvironmentLoad = function (addr, apiKey, envType, area, callback) {
    'use strict';
    var jsonData = {};
    jsonData.serviceName = 'ArpltnInforInqireSvc';
    jsonData.numOfRows = '100';
    jsonData.serviceKey = apiKey;
    jsonData.envType = envType;
    jsonData.sidoName = encodeURIComponent(area);

    this.publicDataInterface(addr, jsonData, function (resultData) {
        callback(resultData);
    });
};


/**
 * 데이터 포털 온실가스배출량 조회 서비스
 * @param {String} addr - 주소
 * @param {String} apiKey - API 키
 * @param {String} startDate - 시작 날짜 (YYYYMM 200701 ~ 201412 까지만 데이터 존재)
 * @param {String} endDate - 종료 날짜 (YYYYMM 200701 ~ 201412 까지만 데이터 존재)
 * @param {function} callback - 성공 콜백 함수
 */
OGDSM.externalConnection.prototype.greenGasEmissionLoad = function (addr, apiKey, startDate, endDate, callback) {
    'use strict';
    var jsonData = {};
    jsonData.serviceName = 'GreenGasEmissionReport';
    jsonData.numOfRows = '100';
    jsonData.serviceKey = apiKey;
    jsonData.startDate = startDate;
    jsonData.endDate = endDate;

    this.publicDataInterface(addr, jsonData, function (resultData) {
        callback(resultData);
    });
};


/**
 * 원자력발전소 실시간 주변 방사선량
 * @param {String} addr - 주소
 * @param {String} apiKey - API 키
 * @param {String} genName - 원자력 발전소 이름 (WS, KR, YK, Plant)
 * @param {function} callback - 성공 콜백 함수
 */
OGDSM.externalConnection.prototype.realTimeLevelofRadiationLoad = function (addr, apiKey, genName, callback) {
    'use strict';
    var jsonData = {};
    jsonData.serviceName = 'NuclearPowerPlantRealtimeLevelofRadiation';
    jsonData.serviceKey = apiKey;
    jsonData.startDate = genName;

    this.publicDataInterface(addr, jsonData, function (resultData) {
        callback(resultData);
    });
};

/**
 * geoServer 데이터 리스트 요청
 * @param {String} addr - 서버 주소
 * @param {String} wsName - 워크스페이스 이름
 * @param {Function} callback - 콜백 함수 function (resultData) {...}
 */
OGDSM.externalConnection.prototype.getLayersGeoServer = function (addr, wsName, callback) {
    'use strict';
    var parm = { wsName : wsName };
    $.mobile.loading('show', {
        text : 'Loading',
        textVisible : 'true',
        theme : 'c',
        textonlt : 'false'
    });
    $.ajax({
        type : 'POST',
        url : addr,
        data : JSON.stringify(parm),
        contentType : 'application/json;charset=UTF-8',
        dataType : 'json',
        success : function (msg) {
            var resultData = msg.data;
            $.mobile.loading('hide');
            callback(resultData);
        },
        error : function (error) {
            console.error(error);
        }
    });
};

