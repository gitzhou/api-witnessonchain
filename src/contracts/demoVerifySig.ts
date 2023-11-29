import { ByteString, SmartContract, assert, method, prop } from 'scrypt-ts';
import { RabinPubKey, RabinSig, WitnessOnChainVerifier } from 'scrypt-ts-lib';

/**
 * A demo contract that verifies oracle's signature
 */
export class DemoVerifySig extends SmartContract {
  // oracle Rabin public key
  @prop()
  oraclePubKey: RabinPubKey;

  constructor(oraclePubKey: RabinPubKey) {
    super(...arguments);
    this.oraclePubKey = oraclePubKey;
  }

  @method()
  public unlock(msg: ByteString, sig: RabinSig) {
    // verify oracle signature
    assert(
      WitnessOnChainVerifier.verifySig(msg, sig, this.oraclePubKey),
      'oracle sig verify failed',
    );
    // deserialize, verify, and consume msg ...
  }
}
