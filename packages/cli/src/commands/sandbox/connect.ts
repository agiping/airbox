import * as e2b from 'e2b'
import * as commander from 'commander'

import { spawnConnectedTerminal } from 'src/terminal'
import { asBold, asPrimary } from 'src/utils/format'
import { ensureAPIKey } from '../../api'

export const connectCommand = new commander.Command('connect')
  .description('connect terminal to already running sandbox')
  .argument('<sandboxID>', `connect to sandbox with ${asBold('<sandboxID>')}`)
  .option(
    '-t, --timeout <timeout>',
    'set sandbox timeout in seconds (e.g., 3600 for 1 hour). If not specified, preserves existing timeout'
  )
  .alias('cn')
  .action(async (sandboxID: string, opts: { timeout?: string }) => {
    try {
      const apiKey = ensureAPIKey()

      if (!sandboxID) {
        console.error('You need to specify sandbox ID')
        process.exit(1)
      }

      const timeoutMs = opts.timeout
        ? parseInt(opts.timeout, 10) * 1000
        : undefined
      if (opts.timeout && (isNaN(timeoutMs!) || timeoutMs! <= 0)) {
        console.error('Timeout must be a positive number (in seconds)')
        process.exit(1)
      }

      await connectToSandbox({ apiKey, sandboxID, timeoutMs })
      // We explicitly call exit because the sandbox is keeping the program alive.
      // We also don't want to call sandbox.close because that would disconnect other users from the edit session.
      process.exit(0)
    } catch (err: any) {
      console.error(err)
      process.exit(1)
    }
  })

async function connectToSandbox({
  apiKey,
  sandboxID,
  timeoutMs,
}: {
  apiKey: string
  sandboxID: string
  timeoutMs?: number
}) {
  const sandbox = await e2b.Sandbox.connect(sandboxID, {
    apiKey,
    ...(timeoutMs !== undefined && { timeoutMs }),
  })

  console.log(
    `Terminal connecting to sandbox ${asPrimary(`${sandbox.sandboxId}`)}`
  )
  await spawnConnectedTerminal(sandbox)
  console.log(
    `Closing terminal connection to sandbox ${asPrimary(sandbox.sandboxId)}`
  )
}
