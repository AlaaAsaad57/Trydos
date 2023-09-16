/** @type {import('next').NextConfig} */
const withSvgr = require("next-svgr");
 
module.exports = withSvgr({
  images:{
    domains:['res.cloudinary.com']
  },
  experimental: { externalDir: true,
    serverActions: true,
  },
  // your config for other plugins or the general next.js here...
});
