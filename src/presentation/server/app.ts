import Fastify from 'npm:fastify@5.1.0'
import cors from 'npm:@fastify/cors@10.0.1'

export async function buildApp() {
  const fastify = Fastify({
    logger: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId'
  })

  // CORS設定
  await fastify.register(cors, {
    origin: true,
    credentials: true
  })

  // ヘルスチェック（認証不要）
  fastify.get('/', async () => {
    return {
      message: 'SBI Portfolio Tracker MCP API',
      version: '1.0.0',
      status: 'running'
    }
  })

  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  })

  // MCP エンドポイント（スタブ実装）
  fastify.get('/mcp/tools', async () => {
    // TODO: 認証ミドルウェア追加
    // TODO: UseCase経由で実装
    return {
      tools: [
        {
          name: "get_portfolio",
          description: "最新のポートフォリオデータを取得",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        }
      ]
    }
  })

  fastify.post('/mcp/call', async (request) => {
    // TODO: 認証ミドルウェア追加
    // TODO: UseCase経由で実装
    const { tool } = request.body as any
    return {
      result: {
        message: `Tool ${tool} will be implemented`,
        timestamp: new Date().toISOString()
      }
    }
  })

  await fastify.ready()
  return fastify
}