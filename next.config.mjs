/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '16mb'
    }
  }
};

export default nextConfig;
