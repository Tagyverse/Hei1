import { build } from 'esbuild';
import { readdir } from 'fs/promises';
import { join } from 'path';

async function buildFunctions() {
  const functionsDir = 'functions/api';
  const files = await readdir(functionsDir);
  const tsFiles = files.filter(f => f.endsWith('.ts'));

  for (const file of tsFiles) {
    const entryPoint = join(functionsDir, file);
    const outfile = entryPoint.replace('.ts', '.js');

    await build({
      entryPoints: [entryPoint],
      bundle: false,
      outfile: outfile,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
    });

    console.log(`✓ Built ${file} → ${file.replace('.ts', '.js')}`);
  }
}

buildFunctions().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
