/**
 * Supabase Edge Functions エントリーポイント
 * src/presentation/server/app.ts を Edge Functions環境で実行
 */
import { buildApp } from '../../../src/presentation/server/app.ts';

// Fastifyアプリケーションを構築
const app = await buildApp();

// Edge Functions用ハンドラー
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Supabase Edge Functionsでは、実際のパスは関数名の後に来る
  // 例: https://xxx.supabase.co/functions/v1/mcp/health
  //     → url.pathname = "/health" (Edge Functions内部では)
  // ただし、関数名だけの場合は "/" となる
  const pathname = url.pathname;

  // リクエストボディの処理
  let body: string | undefined;
  if (req.body) {
    body = await req.text();
  }

  // FastifyのリクエストハンドラーをEdge Functions用に変換
  const response = await app.inject({
    method: req.method as any, // HTTPMethodsの型問題を回避
    url: pathname + url.search,
    headers: Object.fromEntries(req.headers.entries()),
    body: body,
  });

  // レスポンスヘッダーをHeadersInitに変換
  const responseHeaders = new Headers();
  Object.entries(response.headers).forEach(([key, value]) => {
    if (value) {
      responseHeaders.set(key, String(value));
    }
  });

  return new Response(response.body || response.payload, {
    status: response.statusCode,
    headers: responseHeaders,
  });
});
