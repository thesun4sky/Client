goog.provide('openGDSMobile.util.jsonToArray');
goog.provide('openGDSMobile.util.applyOptions');
goog.require('goog.array');

/**
 * @constructor
 */
openGDSMobile.util = function () {

};
openGDSMobile.util.jsonToArray = function (obj, x, y) {
    var xyAxis = [],
        row = obj.row;
    xyAxis[0] = [];
    xyAxis[1] = [];
    goog.array.forEach(row, function (position, index, arr) {
        xyAxis[0].push(row[index][x]);
        xyAxis[1].push(row[index][y]);
    });
    return xyAxis;
}
openGDSMobile.util.applyOptions = function (defaults, options) {
    var name = null;
    for (name in defaults) {
        if (defaults.hasOwnProperty(name)) {
            if (options.hasOwnProperty(name)) {
                defaults[name] = options[name];
            }
        }
    }
    return defaults;
}
/*

 var i,
 maps = this.getMap().getLayers().getArray();
 for (i = 0; i < maps.length; i += 1) {
 if (maps[i].get('title') === layerName) {
 return maps[i];
 }
 }
 return false;
 */
openGDSMobile.util.getOlLayer = function (_olObj, _name) {
    var mapArray = _olObj.getLayers().getArray();
    var result = false;
    goog.array.forEach(mapArray, function (position, index, arr) {
        if (mapArray[index].get('title') === _name) {
            result = mapArray[index];
        }
    });
    return result;
}



