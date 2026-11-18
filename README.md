# Bilheteria Teatro Amazonas

Protótipo acadêmico de uma dApp para eventos e ingressos com assentos fixos. O contrato registra eventos, controla a disponibilidade de cada cadeira e recebe pagamentos em SepoliaETH. O projeto é demonstrativo e não tem vínculo oficial com o Teatro Amazonas.

## Estado do projeto

O contrato define e valida on-chain 120 IDs fixos de assento; o frontend associa esses IDs aos códigos e posições do mapa. A versão atual mudou as assinaturas de criação e compra e precisa ser compilada e implantada novamente. Depois do deploy, atualize endereço e ABI em `frontend/contrato.js`, confira os fluxos com mais de uma conta, complete a documentação final e publique o site e o repositório.

## Estrutura

```text
BilheteriaTeatroAmazonas/
├── contracts/
│   └── BilheteriaTeatroAmazonas.sol
├── docs/
│   └── arquitetura.md
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── contrato.js
│   └── mapa-assentos.js
├── .gitignore
└── README.md
```

## Tecnologias previstas

- Solidity 0.8.24
- Remix IDE para compilar, interagir e implantar o contrato
- Ethereum Sepolia (chain ID 11155111)
- HTML, CSS, JavaScript e Web3.js 4.x via CDN
- MetaMask para conexão e assinatura das transações
- Vercel para hospedar o frontend estático

## Primeiros passos

1. Abra `contracts/BilheteriaTeatroAmazonas.sol` no Remix e compile com Solidity 0.8.24 ou compatível.
2. Implante a versão atual na Sepolia com a conta administradora conectada à MetaMask.
3. Copie o ABI e o novo endereço do mesmo deploy para `frontend/contrato.js`.
4. Abra `frontend/index.html` por um servidor local simples ou publique a pasta `frontend/` na Vercel.
5. Conecte a MetaMask à Sepolia. A página carrega eventos da cadeia; a conta administradora vê o formulário de cadastro e os controles do evento.
6. Para comprar, selecione um evento, abra o mapa e escolha um assento livre. Use somente ETH de teste.

## Rede Sepolia

- Chain ID decimal: `11155111`
- Chain ID hexadecimal: `0xaa36a7`
- Faucet de Sepolia: consulte o faucet recomendado pelo docente.
- Explorador: [Sepolia Etherscan](https://sepolia.etherscan.io/)

## Segurança e dados

Não use chaves privadas, frases de recuperação ou fundos reais. Endereço, valores, assentos, compras e eventos emitidos pelo contrato são públicos na blockchain. O frontend não deve solicitar nem armazenar a frase de recuperação da MetaMask.

## Entrega

Antes de entregar, complete este README com integrantes e papéis, endereço e transação do deploy, link da Vercel, tabela de recursos Solidity, roteiro de testes, limitações e links do vídeo e dos slides.
