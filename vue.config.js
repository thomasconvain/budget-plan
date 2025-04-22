const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
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
