const postgres = require('postgres');
const fs = require('fs');

async function runSeed() {
  const sql_client = postgres(process.env.DATABASE_URL);

  try {
    console.log('Connected to database');

    // Running granular batches
    const batches = [
      'seed_batch_aa', 'seed_batch_ab', 'seed_batch_ac', 'seed_batch_ad',
      'seed_batch_ae', 'seed_batch_af', 'seed_batch_ag', 'seed_batch_ah',
      'seed_batch_ai', 'seed_batch_aj', 'seed_batch_ak', 'seed_batch_al',
      'seed_batch_am', 'seed_batch_an', 'seed_batch_ao'
    ];

    for (const file of batches) {
      if (fs.existsSync(file)) {
        console.log(`Running ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        await sql_client.unsafe(content);
        console.log(`Finished ${file}`);
      }
    }

    const additionalFiles = [
      'seed_map_data.sql',
      'seed_new_products.sql',
      'final_seed_v2.sql'
    ];

    for (const file of additionalFiles) {
      if (fs.existsSync(file)) {
        console.log(`Running ${file}...`);
        const content = fs.readFileSync(file, 'utf8');
        await sql_client.unsafe(content);
        console.log(`Finished ${file}`);
      }
    }

  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    await sql_client.end();
  }
}

runSeed();
