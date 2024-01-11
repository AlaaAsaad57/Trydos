/** @type {import('next').NextConfig} */
const withSvgr = require("next-svgr");
 
module.exports = withSvgr({
  images:{
    domains:['res.cloudinary.com','eu.ui-avatars.com','trydos.s3.ap-south-1.amazonaws.com','market_staging.trydos.tech','s3.ap-south-1.amazonaws.com']
  },
  experimental: { externalDir: true,
  },
  webpack(config, options) {
    config.module.rules.push({
      test: /\.mp3$/,
      use: {
        loader: 'file-loader',
      },
    });
    return config;
  },
  // your config for other plugins or the general next.js here...
});
