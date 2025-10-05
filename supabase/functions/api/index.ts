/**
 * Supabase Edge Functions エントリーポイント
 * src/presentation/server/app.ts を Edge Functions環境で実行
 */
import { buildApp } from '../../../src/presentation/server/app.ts'

// Fastifyアプリケーションを構築
const app = await buildApp()

// Edge Functions用ハンドラー
Deno.serve(async (req: Request) => {
  // FastifyのリクエストハンドラーをEdge Functions用に変換
  const response = await app.inject({
    method: req.method,
    url: new URL(req.url).pathname + new URL(req.url).search,
    headers: Object.fromEntries(req.headers.entries()),
    body: req.body ? await req.text() : undefined
  })

  return new Response(response.body, {
    status: response.statusCode,
    headers: response.headers as HeadersInit
  })
})