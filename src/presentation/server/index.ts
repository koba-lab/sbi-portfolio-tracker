import 'reflect-metadata';
import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
});

fastify.get('/', async () => {
  return {
    message: 'SBI Portfolio Tracker API',
    version: '1.0.0',
    status: 'running'
  };
});

fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
});

const start = async () => {
  try {
    const port = parseInt(Deno.env.get('PORT') || '3000');
    const host = Deno.env.get('HOST') || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    Deno.exit(1);
  }
};

start();