/**
 * Supabase Edge Functions エントリーポイント
 * src/presentation/server/app.ts を Edge Functions環境で実行
 */
import { buildApp } from '../../../src/presentation/server/app.ts'

// Fastifyアプリケーションを構築
const app = await buildApp()

// Edge Functions用ハンドラー
Deno.serve(async (req: Request) => {
  // URLから実際のパスを取得（/functions/v1/api以降を削除）
  const url = new URL(req.url)
  // Supabase Edge Functionsでは/functions/v1/apiがプレフィックスとして付くため、それを除去
  const pathname = url.pathname.replace(/^\/functions\/v1\/api/, '') || '/'

  // FastifyのリクエストハンドラーをEdge Functions用に変換
  const response = await app.inject({
    method: req.method,
    url: pathname + url.search,
    headers: Object.fromEntries(req.headers.entries()),
    body: req.body ? await req.text() : undefined
  })

  return new Response(response.body, {
    status: response.statusCode,
    headers: response.headers as HeadersInit
  })
})