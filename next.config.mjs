/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Adicione esta linha
  images: {
    unoptimized: true, // Necessário para imagens funcionarem no GH Pages
  },
};

export default nextConfig;
