// Private functions
function isNullOrEmpty(value) {
  return !value || value.length === 0 || /^\s*$/.test(value);
}

// Public functions
exports.isNullOrEmpty = isNullOrEmpty;

exports.removeNullOrEmptyPropertiesIn = function(object) {
  for (var propertyName in object) {
    var propertyValue = object[propertyName];

    if (isNullOrEmpty(propertyValue)) 
      delete object[propertyName];
  }
}

exports.proxyProperty = function(object, prop, isData) {
    Object.defineProperty(object.prototype, prop, {
        get: function () {
            if (isData) {
                return this._node.data[prop];
            } else {
                return this._node[prop];
            }
        },
        set: function (value) {
            if (isData) {
                this._node.data[prop] = value;
            } else {
                this._node[prop] = value;
            }
        }
    });
}