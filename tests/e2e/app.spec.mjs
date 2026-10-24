import { test, expect } from '@playwright/test';
import { connect } from 'mqtt';
import { mkdir } from 'node:fs/promises';
import { startBroker } from '../../scripts/broker.mjs';
import { startSimulator, TOPIC_PREFIX } from '../../scripts/simulator.mjs';

const topic = suffix => `${TOPIC_PREFIX}/${suffix}`;
let broker, simulator, observer, brokerUrl;
let received = [];

test.beforeEach(async () => {
  received = [];
  broker = await startBroker({ port: 0, host: '127.0.0.1', quiet: true });
  brokerUrl = `ws://127.0.0.1:${broker.server.address().port}/mqtt`;
  observer = connect(brokerUrl, { reconnectPeriod: 0 });
  observer.on('message', (name, buffer) => received.push({ topic: name, payload: buffer.toString() }));
  await new Promise((resolve, reject) => { observer.once('connect', resolve); observer.once('error', reject); });
  await observer.subscribeAsync(`${TOPIC_PREFIX}/#`, { qos: 1 });
  simulator = await startSimulator({ url: brokerUrl, intervalMs: 60_000, confirmationDelayMs: 1500, quiet: true });
  await expect.poll(() => received.some(message => message.topic === topic('sensor/umidade'))).toBe(true);
});
test.afterEach(async () => {
  await simulator?.close();
  await observer?.endAsync(true);
  await broker?.close();
});

async function openConnected(page) {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Configurações' }).click();
  await page.getByTestId('broker-url').fill(brokerUrl);
  await page.getByRole('button', { name: 'Salvar endereço', exact: true }).click();
  await expect(page.getByTestId('notice')).toContainText('Endereço salvo');
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await expect(page.getByTestId('connection-status')).toHaveText('Conectado');
  await page.getByRole('tab', { name: 'Painel' }).click();
  await expect(page.getByTestId('temperature-value')).toContainText('24,5');
  await expect(page.getByTestId('humidity-value')).toContainText('61');
  await expect(page.getByTestId('lamp-state')).toHaveText('Desligada');
}
async function dismiss(page) {
  const close = page.getByRole('button', { name: 'Fechar aviso' });
  if (await close.isVisible()) await close.click();
}
async function capture(page, theme) {
  if (process.env.CAPTURE_DOCS !== '1') return;
  await mkdir('docs/screenshots', { recursive: true });
  await dismiss(page);
  for (const [name, file] of [['Painel', 'dashboard'], ['Histórico', 'historico'], ['Configurações', 'configuracoes']]) {
    await page.getByRole('tab', { name }).click();
    await page.screenshot({ path: `docs/screenshots/${file}-${theme}.png` });
  }
}

test('ciclo MQTT real, confirmação, histórico, validação e preferências persistentes', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await openConnected(page);
  await dismiss(page);
  await page.getByRole('button', { name: 'Ligar', exact: true }).click();
  await expect(page.getByTestId('command-pending')).toBeVisible();
  await expect(page.getByTestId('lamp-state')).toHaveText('Desligada');
  await expect(page.getByTestId('lamp-state')).toHaveText('Ligada');
  await expect(page.getByTestId('command-pending')).toHaveCount(0);
  expect(received.some(message => message.topic === topic('lampada/comando') && JSON.parse(message.payload).action === 'ON')).toBe(true);
  await capture(page, 'dark');
  await page.getByRole('tab', { name: 'Configurações' }).click();
  await page.getByRole('button', { name: 'Tema claro', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tema claro', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await capture(page, 'light');
  await page.getByRole('tab', { name: 'Painel' }).click();
  await page.getByRole('button', { name: 'Desligar', exact: true }).click();
  await expect(page.getByTestId('lamp-state')).toHaveText('Ligada');
  await expect(page.getByTestId('lamp-state')).toHaveText('Desligada');
  expect(received.some(message => message.topic === topic('lampada/comando') && JSON.parse(message.payload).action === 'OFF')).toBe(true);
  await observer.publishAsync(topic('sensor/temperatura'), '{"value":27.2}', { qos: 1 });
  await observer.publishAsync(topic('sensor/umidade'), '{"value":64}', { qos: 1 });
  await expect(page.getByTestId('temperature-value')).toContainText('27,2');
  await expect(page.getByTestId('humidity-value')).toContainText('64');
  await observer.publishAsync(topic('sensor/temperatura'), '{"value":"quente"}', { qos: 1 });
  await expect(page.getByTestId('notice')).toContainText('Mensagem ignorada');
  await expect(page.getByTestId('temperature-value')).toContainText('27,2');
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await expect(page.getByTestId('message-item').first()).toContainText('quente');
  await expect(page.getByTestId('message-item').first()).toContainText('inválidos');
  for (let value = 30; value < 45; value++) await observer.publishAsync(topic('sensor/temperatura'), JSON.stringify({ value }), { qos: 1 });
  await expect(page.getByTestId('message-item')).toHaveCount(10);
  await expect(page.getByTestId('message-item').first()).toContainText('{"value":44}');
  await expect(page.getByTestId('message-item').last()).toContainText('{"value":35}');
  await page.reload();
  await page.getByRole('tab', { name: 'Configurações' }).click();
  await expect(page.getByTestId('broker-url')).toHaveValue(brokerUrl);
  await expect(page.getByRole('button', { name: 'Tema claro', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('connection-status')).toHaveText('Desconectado');
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await expect(page.getByTestId('message-item')).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test('reconexões não duplicam mensagens; timeout e publicação offline dão feedback', async ({ page }) => {
  await openConnected(page);
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
    await expect(page.getByTestId('connection-status')).toHaveText('Desconectado');
    await page.getByRole('button', { name: 'Conectar', exact: true }).click();
    await expect(page.getByTestId('connection-status')).toHaveText('Conectado');
  }
  await observer.publishAsync(topic('sensor/temperatura'), '{"value":42.7}', { qos: 1 });
  await expect(page.getByTestId('temperature-value')).toContainText('42,7');
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await expect(page.getByTestId('message-item').filter({ hasText: '{"value":42.7}' })).toHaveCount(1);
  await page.getByRole('tab', { name: 'Painel' }).click();
  await simulator.close(); simulator = undefined;
  await page.getByRole('button', { name: 'Ligar', exact: true }).click();
  await expect(page.getByTestId('command-pending')).toBeVisible();
  await expect(page.getByTestId('notice')).toContainText('sem confirmação em 6 segundos');
  await expect(page.getByTestId('lamp-state')).toHaveText('Desligada');
  await page.getByRole('button', { name: 'Desconectar', exact: true }).click();
  const countBefore = received.filter(message => message.topic === topic('lampada/comando')).length;
  await page.getByRole('button', { name: 'Ligar', exact: true }).click();
  await expect(page.getByTestId('notice')).toContainText('Conecte-se');
  expect(received.filter(message => message.topic === topic('lampada/comando'))).toHaveLength(countBefore);
});

test('endereço inválido e falha de conexão permitem correção e reconexão', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Configurações' }).click();
  await page.getByTestId('broker-url').fill('mqtt://localhost:1883');
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await expect(page.getByTestId('notice')).toContainText('ws://');
  await page.getByTestId('broker-url').fill('ws://127.0.0.1:1/mqtt');
  await page.getByRole('button', { name: 'Conectar', exact: true }).click();
  await expect(page.getByTestId('connection-status')).toHaveText('Erro de conexão');
  await expect(page.getByRole('button', { name: 'Reconectar', exact: true })).toBeVisible();
  await page.getByTestId('broker-url').fill(brokerUrl);
  await page.getByRole('button', { name: 'Reconectar', exact: true }).click();
  await expect(page.getByTestId('connection-status')).toHaveText('Conectado');
});
