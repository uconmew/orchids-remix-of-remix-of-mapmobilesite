const postgres = require('postgres');
const fs = require('fs');

async function runSeed() {
  const sql_client = postgres(process.env.DATABASE_URL);

  try {
    console.log('Connected to database');

      const files = [
        'seed_batch_aa', 'seed_batch_ab', 'seed_batch_ac', 'seed_batch_ad',
        'seed_batch_ae', 'seed_batch_af', 'seed_batch_ag', 'seed_batch_ah',
        'seed_batch_ai', 'seed_batch_aj', 'seed_batch_ak', 'seed_batch_al',
        'seed_batch_am', 'seed_batch_an', 'seed_batch_ao',
        'seed_212_installations.sql',
        'seed_map_data.sql',
        'seed_new_products.sql',
        'final_seed_v2.sql'
      ];

    const insertPrefix = "INSERT INTO products (name, description, price, category, sub_category, brand, image_url, active, stock_quantity) VALUES ";
    const insertPrefixBasic = "INSERT INTO products (name, description, price, category, brand, image_url, stock_quantity, active) VALUES ";

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      console.log(`Processing ${file}...`);
      const content = fs.readFileSync(file, 'utf8');
      
      // Split by semicolon, but try to avoid splitting inside quotes
      // This is a simple regex that works for most standard SQL seed files
      const statements = content.split(/;\s*$/m);

      for (let statement of statements) {
        statement = statement.trim();
        if (!statement) continue;
        
        try {
          await sql_client.unsafe(statement + ';');
        } catch (err) {
          console.error(`Error in file ${file} at statement: ${statement.slice(0, 100)}...`);
          throw err;
        }
      }
      console.log(`Finished ${file}`);
    }

  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    await sql_client.end();
  }
}

runSeed();
