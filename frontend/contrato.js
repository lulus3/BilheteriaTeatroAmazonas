// O contrato agora valida o inventário fixo de assentos (IDs 1-120) on-chain.
// Faça um novo deploy, pois o ABI e a assinatura das funções mudaram.
// Depois copie o endereço e o ABI desse novo deploy no Remix.
window.BILHETERIA_CONTRACT = {
  address: "0x726227c0066A35f3fe2b06c32Ca6Fb1650B802AD",
  abi: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "chamador",
          "type": "address"
        }
      ],
      "name": "AcessoRestrito",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AjustePrecoInvalido",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        },
        {
          "internalType": "enum BilheteriaTeatroAmazonas.StatusEvento",
          "name": "novoStatus",
          "type": "uint8"
        }
      ],
      "name": "alterarStatusEvento",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "assentoId",
          "type": "uint16"
        }
      ],
      "name": "AssentoDuplicado",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "assentoId",
          "type": "uint16"
        }
      ],
      "name": "AssentoInvalido",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        },
        {
          "internalType": "uint16",
          "name": "assentoId",
          "type": "uint16"
        }
      ],
      "name": "AssentoOcupado",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        },
        {
          "internalType": "uint16[]",
          "name": "assentoIds",
          "type": "uint16[]"
        }
      ],
      "name": "comprarIngressos",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "ingressoIds",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "nome",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "dataHora",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "local",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "precoWei",
              "type": "uint256"
            },
            {
              "internalType": "int256",
              "name": "ajustePrecoWei",
              "type": "int256"
            },
            {
              "internalType": "bytes32",
              "name": "referenciaPrograma",
              "type": "bytes32"
            },
            {
              "internalType": "address payable",
              "name": "organizador",
              "type": "address"
            }
          ],
          "internalType": "struct BilheteriaTeatroAmazonas.DadosNovoEvento",
          "name": "dados",
          "type": "tuple"
        }
      ],
      "name": "criarEvento",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "DimensoesInvalidas",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        }
      ],
      "name": "EventoInvalido",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        }
      ],
      "name": "EventoNaoAgendado",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "FalhaNoSaque",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "ingressoId",
          "type": "uint256"
        }
      ],
      "name": "IngressoInvalido",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ListaAssentosVazia",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "Reentrancia",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SemReceitaPendente",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "esperado",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "recebido",
          "type": "uint256"
        }
      ],
      "name": "ValorIncorreto",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "nome",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "organizador",
          "type": "address"
        }
      ],
      "name": "EventoCriado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "ingressoId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "comprador",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint16",
          "name": "assentoId",
          "type": "uint16"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "valorPago",
          "type": "uint256"
        }
      ],
      "name": "IngressoComprado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "organizador",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "valor",
          "type": "uint256"
        }
      ],
      "name": "ReceitaSacada",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "sacarReceita",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum BilheteriaTeatroAmazonas.StatusEvento",
          "name": "novoStatus",
          "type": "uint8"
        }
      ],
      "name": "StatusDoEventoAlterado",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "administrador",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        },
        {
          "internalType": "uint16",
          "name": "assentoId",
          "type": "uint16"
        }
      ],
      "name": "assentoDisponivel",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "CHAIN_ID_SEPOLIA",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        }
      ],
      "name": "consultarEvento",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "nome",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "dataHora",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "local",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "precoWei",
              "type": "uint256"
            },
            {
              "internalType": "int256",
              "name": "ajustePrecoWei",
              "type": "int256"
            },
            {
              "internalType": "bytes32",
              "name": "referenciaPrograma",
              "type": "bytes32"
            },
            {
              "internalType": "uint16",
              "name": "totalAssentos",
              "type": "uint16"
            },
            {
              "internalType": "uint256",
              "name": "ingressosVendidos",
              "type": "uint256"
            },
            {
              "internalType": "address payable",
              "name": "organizador",
              "type": "address"
            },
            {
              "internalType": "enum BilheteriaTeatroAmazonas.StatusEvento",
              "name": "status",
              "type": "uint8"
            }
          ],
          "internalType": "struct BilheteriaTeatroAmazonas.Evento",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "ingressoId",
          "type": "uint256"
        }
      ],
      "name": "consultarIngresso",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "eventoId",
              "type": "uint256"
            },
            {
              "internalType": "uint16",
              "name": "assentoId",
              "type": "uint16"
            },
            {
              "internalType": "address",
              "name": "comprador",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "valorPago",
              "type": "uint256"
            }
          ],
          "internalType": "struct BilheteriaTeatroAmazonas.Ingresso",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "LIMITE_INGRESSOS_POR_CONSULTA",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "listarEventos",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "inicio",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "listarMeusIngressos",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "pagina",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "meusIngressos",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "eventoId",
          "type": "uint256"
        }
      ],
      "name": "precoIngresso",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "proximoEventoId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "proximoIngressoId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "organizador",
          "type": "address"
        }
      ],
      "name": "receitaPendente",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "valorPendente",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "TOTAL_ASSENTOS",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};
