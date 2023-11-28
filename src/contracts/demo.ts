import {
  ByteString,
  SmartContract,
  assert,
  method,
  prop,
  byteString2Int,
} from 'scrypt-ts';
import { RabinPubKey, RabinSig, RabinVerifier } from 'scrypt-ts-lib';
import { toRabinSig, deserialize } from 'rabinsig';

export type OraclePubKeyResponse = {
  publicKey: ByteString;
};

export type OracleSigResponse = {
  signature: { s: ByteString; padding: ByteString };
};

/**
 * A demo contract that verifies oracle's signature
 */
export class Demo extends SmartContract {
  // oracle Rabin public key
  @prop()
  oraclePubKey: RabinPubKey;

  constructor(oraclePubKey: RabinPubKey) {
    super(...arguments);
    this.oraclePubKey = oraclePubKey;
  }

  @method()
  public unlock(data: ByteString, sig: RabinSig) {
    // verify oracle signature
    assert(
      RabinVerifier.verifySig(data, sig, this.oraclePubKey),
      'oracle sig verify failed',
    );
    // deserialize and verify data ...
  }

  static parsePubKey(response: OraclePubKeyResponse): RabinPubKey {
    return byteString2Int(response.publicKey + '00') as RabinPubKey;
  }

  static parseSig(response: OracleSigResponse): RabinSig {
    return toRabinSig(deserialize(response.signature));
  }
}
