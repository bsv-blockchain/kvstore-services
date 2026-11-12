import { PrivateKey, ProtoWallet, PushDrop, Transaction, UnlockingScript, Utils } from '@bsv/sdk'
import KVStoreTopicManager from '../KVStoreTopicManager.js'

describe.each([false, true])('SDK token compatibility, tags=%s', (withTags) => {
  async function token (): Promise<number[]> {
    // Public test identity and deliberately nonexistent funding ancestry.
    const wallet = new ProtoWallet(new PrivateKey(1))
    const controller = (await wallet.getPublicKey({ identityKey: true })).publicKey
    const fields = [
      Utils.toArray(JSON.stringify([1, 'authsig']), 'utf8'),
      Utils.toArray('compatibility-test', 'utf8'),
      Utils.toArray('synthetic test value', 'utf8'),
      Utils.toArray(controller, 'hex')
    ]
    if (withTags) fields.push(Utils.toArray(JSON.stringify(['compatibility']), 'utf8'))
    const lockingScript = await new PushDrop(wallet).lock(fields, [1, 'authsig'], 'compatibility-test', 'anyone', true)
    return new Transaction(1, [{
      sourceTXID: '11'.repeat(32),
      sourceOutputIndex: 0,
      unlockingScript: new UnlockingScript(),
      sequence: 0xffffffff
    }], [{ satoshis: 1, lockingScript }]).toBEEF(true)
  }

  it('admits a token with a real SDK signature', async () => {
    const result = await new KVStoreTopicManager().identifyAdmissibleOutputs(await token(), [])
    expect(result.outputsToAdmit).toEqual([0])
  })

  it('rejects altered content without replacing its signature', async () => {
    const beef = await token()
    const offset = Buffer.from(beef).indexOf(Buffer.from('synthetic test value'))
    expect(offset).toBeGreaterThan(-1)
    beef[offset] ^= 1
    const result = await new KVStoreTopicManager().identifyAdmissibleOutputs(beef, [])
    expect(result.outputsToAdmit).toEqual([])
  })
})
