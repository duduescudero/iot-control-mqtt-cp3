# Registro de verificação

Validação local em **24/10/2026**, Node.js 24.22.1, Windows, Chrome e viewport Web de 430 × 1200. Os prints do README foram capturados durante o fluxo real com broker Aedes e simulador MQTT.js, sem substituir a comunicação por dados simulados na interface.

| Verificação | Resultado |
|---|---|
| TypeScript em modo estrito (`npm run typecheck`) | Sem erros |
| Testes unitários (`npm test`) | 23 testes aprovados |
| Integração pela interface (`npm run test:e2e`) | 3 cenários aprovados |
| Exportação Expo Android, iOS e Web (`npm run build:all`) | Bundles gerados |
| Compatibilidade (`npx expo install --check`) | Dependências compatíveis |
| Conexão ao broker público WSS na porta 8081 | Conexão MQTT aceita |

## Cobertura dos três cenários de integração

1. Conectar ao broker, receber temperatura/umidade/estado, enviar ON e OFF e esperar a resposta do simulador; comprovar que a lâmpada não muda antes da confirmação; receber novas leituras; rejeitar dados inválidos; limitar o histórico a dez eventos na ordem correta; restaurar broker e tema após recarregar; confirmar que o histórico é da sessão. Também verifica ausência de exceções JavaScript na página.
2. Desconectar e reconectar três vezes; publicar uma leitura específica e conferir um único registro, sem listeners duplicados; desligar o simulador, enviar comando e verificar o aviso de timeout sem alteração de estado; tentar publicar desconectado e conferir feedback e ausência de publicação.
3. Rejeitar URL MQTT TCP, mostrar erro para um endpoint WebSocket indisponível e permitir corrigir o endereço e reconectar com sucesso.

Os testes unitários verificam contratos JSON, tipos e limites dos sensores, URLs, publicação offline, inscrições, invalidação de callbacks antigos, encerramento e limite das tentativas de reconexão.

## Reproduzir

```sh
npm ci
npm run typecheck
npm test
npm run build:all
npx playwright install chromium
npm run test:e2e
```

No Windows local com Chrome instalado, também é possível selecionar esse navegador no PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:e2e
```

Para atualizar os prints durante o primeiro cenário:

```powershell
$env:CAPTURE_DOCS = '1'
npm run test:e2e
```

O Playwright inicia o servidor da exportação em `127.0.0.1:4173`; cada cenário abre seu próprio broker numa porta livre e encerra os clientes ao terminar. O relatório HTML fica em `playwright-report/`, e traces/capturas de falhas ficam em `test-results/`; essas pastas não são versionadas. O workflow disponibiliza os relatórios como artefato em caso de falha.

## Limites da evidência

Exportar um bundle nativo valida o empacotamento, mas não equivale a executar em um aparelho físico. A validação funcional automatizada foi feita na plataforma Web. O broker público foi verificado separadamente; a integração automatizada usa o broker local para ser reproduzível.

O `npm audit` da instalação também sinalizou dependências transitivas das ferramentas Expo (`node-forge` e `zod`). A sugestão automática envolve voltar ao Expo 44, incompatível com este projeto; não foi aplicado `audit fix --force`. Essas dependências pertencem ao ferramental de desenvolvimento e devem ser reavaliadas quando o Expo disponibilizar versões compatíveis corrigidas.
