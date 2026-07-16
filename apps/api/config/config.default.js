'use strict'

module.exports = (appInfo) => ({
  keys: `${appInfo.name}_school_uniform_digital_identity`,
  security: {
    csrf: {
      enable: false,
    },
  },
  cluster: {
    listen: {
      port: 7001,
    },
  },
})
