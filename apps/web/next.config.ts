import "@notestack/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	serverExternalPackages: ["libsql", "@libsql/client"],
	// Empty turbopack config to allow both turbopack and webpack configs
	turbopack: {},
	webpack: (config) => {
		// Required for react-pdf to work with PDF.js worker
		config.resolve.alias.canvas = false;
		return config;
	},
};

export default nextConfig;
