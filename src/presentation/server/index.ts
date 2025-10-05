/**
 * ローカル開発用エントリーポイント
 */
import 'npm:reflect-metadata'
import { buildApp } from './app.ts'

const start = async () => {
  try {
    const app = await buildApp()

    const port = parseInt(Deno.env.get('PORT') || '3000')
    const host = Deno.env.get('HOST') || '0.0.0.0'

    await app.listen({ port, host })
    console.log(`🚀 Server running at http://${host}:${port}`)
  } catch (err) {
    console.error(err)
    Deno.exit(1)
  }
}

start()