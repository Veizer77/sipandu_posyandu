import fs from 'fs';
import { createClient } from '@insforge/sdk';

async function main() {
  const client = createClient({
    baseUrl: 'https://6i9ja6g9.us-east.insforge.app',
    anonKey: 'anon_c96fb04fdf42783ed160148118711f6b909f25fffeb3440ccc650a2996907cc6',
  });

  const loginRes = await client.auth.signInWithPassword({
    email: 'kader@flamboyan.id',
    password: 'password123',
  });

  if (loginRes.error) {
    console.error('Login failed:', loginRes.error);
    process.exit(1);
  }

  const { data: dbKel, error: kErr } = await client.database.from('keluarga').select('*');
  const { data: dbAgt, error: aErr } = await client.database.from('anggota').select('*');

  if (kErr || aErr) {
    console.error('Fetch failed:', kErr || aErr);
    process.exit(1);
  }

  console.log(`Fetched from InsForge: ${dbKel.length} keluarga, ${dbAgt.length} anggota`);

  const kelMap = new Map();
  dbKel.forEach((k) => kelMap.set(k.nomor_kk, k.id));

  const agtMap = new Map();
  dbAgt.forEach((a) => agtMap.set(a.nik, a));

  let seedContent = fs.readFileSync('src/lib/seedData.ts', 'utf8');

  let kelReplaced = 0;
  seedContent = seedContent.replace(
    /\{\s*id:\s*"([^"]+)",\s*nomor_kk:\s*"([^"]+)"/g,
    (match, oldId, noKK) => {
      const newId = kelMap.get(noKK);
      if (newId) {
        kelReplaced++;
        return match.replace(oldId, newId);
      }
      return match;
    }
  );

  let agtReplaced = 0;
  seedContent = seedContent.replace(
    /id:\s*"([^"]+)",\s*keluarga_id:\s*"([^"]+)",\s*nik:\s*"([^"]+)"/g,
    (match, oldId, oldKelId, nik) => {
      const dbRecord = agtMap.get(nik);
      if (dbRecord) {
        agtReplaced++;
        return `id: "${dbRecord.id}",\n      keluarga_id: "${dbRecord.keluarga_id}",\n      nik: "${nik}"`;
      }
      return match;
    }
  );

  console.log(`Replaced: ${kelReplaced} keluarga IDs, ${agtReplaced} anggota IDs`);
  fs.writeFileSync('src/lib/seedData.ts', seedContent, 'utf8');
  console.log('src/lib/seedData.ts updated successfully with real InsForge UUIDs!');
}

main().catch(console.error);
