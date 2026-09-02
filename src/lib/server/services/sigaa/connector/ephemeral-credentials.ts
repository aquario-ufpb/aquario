import "server-only";

import { parseEphemeralCredentialInput } from "./connector-contract-v1";

type CredentialValues = {
  username: string;
  password: string;
};

export class EphemeralSigaaCredentials {
  #values: CredentialValues | null;

  private constructor(values: CredentialValues) {
    this.#values = values;
  }

  static parse(input: unknown): EphemeralSigaaCredentials {
    return new EphemeralSigaaCredentials(parseEphemeralCredentialInput(input));
  }

  useOnce<T>(consumer: (value: CredentialValues) => T): T {
    const values = this.#values;
    if (values === null) {
      throw new TypeError("SIGAA credentials were already consumed");
    }

    this.#values = null;
    const exposed = { ...values };
    try {
      return consumer(exposed);
    } finally {
      values.username = "";
      values.password = "";
      exposed.username = "";
      exposed.password = "";
    }
  }

  toJSON(): never {
    throw new TypeError("SIGAA credentials are not serializable");
  }
}
