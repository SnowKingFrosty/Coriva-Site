const path = require('node:path');
const esbuild = require('esbuild');
esbuild.build({
  absWorkingDir: __dirname, entryPoints: ['script.js'], outfile: 'app.bundle.js',
  bundle: true, minify: true, format: 'iife', target: ['es2020'],
  plugins: [{name: 'firebase-local', setup(build) {
    build.onResolve({filter: /^https:\/\/www\.gstatic\.com\/firebasejs\//}, args => {
      const name = args.path.match(/firebase-([a-z]+)\.js$/)[1];
      return {path: require.resolve('firebase/' + name)};
    });
  }}]
}).catch(() => process.exit(1));
