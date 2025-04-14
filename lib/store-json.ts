import { promises as fs } from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function loadAndStoreBenefits() {
  const benefitsDir = path.join(process.cwd(), 'public', 'benefits');
  const files = await fs.readdir(benefitsDir);

  for (const file of files) {
    const filePath = path.join(benefitsDir, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    try {
      // Directly store the JSON content as a string
      const key = `benefits:${path.basename(file, path.extname(file))}`;
      await redis.set(key, fileContent);
      console.log(`Stored document with key: ${key}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
}

loadAndStoreBenefits().catch(console.error);
