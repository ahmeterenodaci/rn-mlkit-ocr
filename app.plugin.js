const plugin = require('./plugin/build/index');

module.exports = plugin.default || plugin;

// Also support named export for better compatibility
if (plugin.default) {
  module.exports.default = plugin.default;
}
