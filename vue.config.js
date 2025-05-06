const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
module.exports = defineConfig({
  transpileDependencies: true,

  // 1) Inyectamos la flag para producción
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        // en producción desactiva el detalle de mismatch para mejor tree-shaking
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
        // si prefieres verlo solo en dev podrías usar:
        // __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(process.env.NODE_ENV !== 'production')
      })
    ]
  },

  devServer: {
    client: {
      overlay: {
        // errores de compilación (syntax, type, etc.)
        errors:   true,
        // warnings de compilación
        warnings: false,
        // errores en tiempo de ejecución (unhandled promise rejections, excepciones uncaught)
        runtimeErrors: false
      }
    }
  }
})
