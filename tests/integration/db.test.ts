import { assertEquals } from 'jsr:@std/assert';
import postgres from 'npm:postgres@3.4.4';
import { load } from 'jsr:@std/dotenv';

// Load .env.test for testing
await load({ envPath: '.env.test' });

Deno.test('Database connection test', async () => {
  const databaseUrl = Deno.env.get('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(databaseUrl);

  try {
    // Simple query to verify connection
    const result = await sql<Array<{ now: Date }>>`SELECT NOW() as now`;

    assertEquals(Array.isArray(result), true);
    assertEquals(result.length, 1);
    assertEquals(result[0].now instanceof Date, true);
  } finally {
    await sql.end();
  }
});
