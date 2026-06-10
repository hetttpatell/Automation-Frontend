import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Auto-copy helper images on startup
try {
  const srcDir = "C:\\Users\\Jitu\\.gemini\\antigravity-ide\\brain\\53e394a2-3fe4-4e9e-9e4a-ea2537c39e58";
  const destDir = path.join(process.cwd(), "public", "setup");
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const filesToCopy = [
    { src: "generate_access_token_step_generic_v3_cropped_1781085703282.png", dest: "step1.png" },
    { src: "phone_number_id_step_generic_v3_cropped_1781085717403.png", dest: "step2.png" },
    { src: "waba_id_step_generic_v3_cropped_1781085729923.png", dest: "step3.png" }
  ];

  filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(srcDir, src);
    const destPath = path.join(destDir, dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[NextConfig] Successfully copied ${src} to ${destPath}`);
    } else {
      console.warn(`[NextConfig] Source file not found: ${srcPath}`);
    }
  });
} catch (error) {
  console.error("[NextConfig] Error copying helper images:", error);
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
