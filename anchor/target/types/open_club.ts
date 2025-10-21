/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/open_club.json`.
 */
export type OpenClub = {
  "address": "GdoWQHsftLM5WC87SMahHX95ryLb13B8juGCY32BGFNv",
  "metadata": {
    "name": "openClub",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addWhitelist",
      "discriminator": [
        215,
        46,
        143,
        176,
        108,
        113,
        24,
        1
      ],
      "accounts": [
        {
          "name": "manager",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "instance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "instance.name",
                "account": "instance"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "approveAdmin",
      "discriminator": [
        223,
        109,
        37,
        168,
        85,
        117,
        185,
        40
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "info",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "claimAddon",
      "discriminator": [
        39,
        44,
        42,
        187,
        106,
        60,
        126,
        39
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "info",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        },
        {
          "name": "captain",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  112,
                  116,
                  97,
                  105,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claimCaptainship",
      "discriminator": [
        105,
        225,
        255,
        95,
        74,
        229,
        67,
        207
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "info",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        },
        {
          "name": "captain",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  112,
                  116,
                  97,
                  105,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claimInstance",
      "discriminator": [
        148,
        243,
        188,
        222,
        206,
        143,
        22,
        245
      ],
      "accounts": [
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "instance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "instance.name",
                "account": "instance"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createInstance",
      "discriminator": [
        144,
        215,
        115,
        236,
        153,
        53,
        87,
        28
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "info",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "optional": true
        },
        {
          "name": "captain",
          "optional": true
        },
        {
          "name": "instance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "instanceType",
          "type": {
            "defined": {
              "name": "instanceType"
            }
          }
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "days",
          "type": "i64"
        }
      ]
    },
    {
      "name": "grantPrivateInstance",
      "discriminator": [
        125,
        124,
        184,
        175,
        168,
        0,
        131,
        255
      ],
      "accounts": [
        {
          "name": "manager",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "instance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  115,
                  116,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "instance.name",
                "account": "instance"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initConfig",
      "discriminator": [
        23,
        235,
        115,
        232,
        168,
        96,
        1,
        231
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "info",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "instanceLimit",
          "type": "u16"
        },
        {
          "name": "addonLimit",
          "type": "u16"
        }
      ]
    },
    {
      "name": "rejectAdmin",
      "discriminator": [
        253,
        12,
        169,
        115,
        88,
        117,
        177,
        252
      ],
      "accounts": [
        {
          "name": "manager",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "info",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "wallet",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "requestAdmin",
      "discriminator": [
        188,
        210,
        222,
        116,
        244,
        23,
        93,
        70
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config"
        },
        {
          "name": "info",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "setAddonLimit",
      "discriminator": [
        231,
        85,
        106,
        145,
        227,
        76,
        135,
        83
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config"
        },
        {
          "name": "info",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "addonLimit",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setAdminStatus",
      "discriminator": [
        128,
        223,
        157,
        71,
        34,
        77,
        219,
        157
      ],
      "accounts": [
        {
          "name": "manager",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  109,
                  105,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "admin.wallet",
                "account": "admin"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "status",
          "type": "bool"
        }
      ]
    },
    {
      "name": "setInstanceLimit",
      "discriminator": [
        214,
        165,
        226,
        187,
        158,
        8,
        218,
        47
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config"
        },
        {
          "name": "info",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  102,
                  111
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "instanceLimit",
          "type": "u16"
        }
      ]
    },
    {
      "name": "setManager",
      "discriminator": [
        30,
        197,
        171,
        92,
        121,
        184,
        151,
        165
      ],
      "accounts": [
        {
          "name": "manager",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newManager",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "admin",
      "discriminator": [
        244,
        158,
        220,
        65,
        8,
        73,
        4,
        65
      ]
    },
    {
      "name": "captain",
      "discriminator": [
        125,
        56,
        140,
        26,
        152,
        248,
        52,
        189
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "info",
      "discriminator": [
        147,
        65,
        188,
        74,
        227,
        5,
        241,
        181
      ]
    },
    {
      "name": "instance",
      "discriminator": [
        202,
        22,
        81,
        185,
        174,
        92,
        85,
        47
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyInitialized",
      "msg": "Config Already Initialized"
    },
    {
      "code": 6001,
      "name": "limitExceeded",
      "msg": "Limit Exceeded"
    },
    {
      "code": 6002,
      "name": "notManager",
      "msg": "Only Manager"
    },
    {
      "code": 6003,
      "name": "notAuthorized",
      "msg": "Not authorized"
    },
    {
      "code": 6004,
      "name": "alreadyRequested",
      "msg": "Already requested"
    },
    {
      "code": 6005,
      "name": "listIsFull",
      "msg": "List Is Full"
    },
    {
      "code": 6006,
      "name": "requestNotFound",
      "msg": "Request not found"
    },
    {
      "code": 6007,
      "name": "insufficientFunds",
      "msg": "Insufficient Funds"
    },
    {
      "code": 6008,
      "name": "overflow",
      "msg": "overflow"
    },
    {
      "code": 6009,
      "name": "expired",
      "msg": "expired"
    },
    {
      "code": 6010,
      "name": "existingValue",
      "msg": "Existing Value"
    }
  ],
  "types": [
    {
      "name": "admin",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "instanceList",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "captain",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "instanceList",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "remainingLimit",
            "type": "u16"
          },
          {
            "name": "addonCount",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "manager",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "info",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "instanceIds",
            "type": "u64"
          },
          {
            "name": "instanceLimit",
            "type": "u16"
          },
          {
            "name": "addonLimit",
            "type": "u16"
          },
          {
            "name": "adminRequests",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "instance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "instanceId",
            "type": "u64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "instanceType",
            "type": {
              "defined": {
                "name": "instanceType"
              }
            }
          },
          {
            "name": "consumers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "whitelist",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "instanceType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "private"
          },
          {
            "name": "whitelisted"
          },
          {
            "name": "portfolio"
          },
          {
            "name": "public"
          }
        ]
      }
    }
  ]
};
