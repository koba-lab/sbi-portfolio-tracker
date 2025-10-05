import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts"
import { buildApp } from "../../src/presentation/server/app.ts"

Deno.test("API Integration - ヘルスチェック", async () => {
  const app = await buildApp()

  const response = await app.inject({
    method: 'GET',
    url: '/health'
  })

  assertEquals(response.statusCode, 200)
  const body = JSON.parse(response.body)
  assertEquals(body.status, 'healthy')

  await app.close()
})

Deno.test("API Integration - MCPツール一覧取得", async () => {
  const app = await buildApp()

  const response = await app.inject({
    method: 'GET',
    url: '/mcp/tools'
  })

  assertEquals(response.statusCode, 200)
  const body = JSON.parse(response.body)
  assertEquals(Array.isArray(body.tools), true)
  assertEquals(body.tools.length > 0, true)
  assertEquals(body.tools[0].name, 'get_portfolio')

  await app.close()
})

Deno.test("API Integration - MCP Tool実行（スタブ）", async () => {
  const app = await buildApp()

  const response = await app.inject({
    method: 'POST',
    url: '/mcp/call',
    payload: {
      tool: 'get_portfolio',
      arguments: {}
    }
  })

  assertEquals(response.statusCode, 200)
  const body = JSON.parse(response.body)
  assertEquals(body.result.message, 'Tool get_portfolio will be implemented')

  await app.close()
})