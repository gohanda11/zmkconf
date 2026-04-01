<script lang="ts">
  import { browser } from '$app/environment';
  import { keyboard } from '$lib/keyboard/store.svelte';
  import KeyboardView from '$lib/components/KeyboardView.svelte';
  import ThresholdEditor from '$lib/components/ThresholdEditor.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';

  const webSerialSupported = browser && 'serial' in navigator;

  async function handleConnect() {
    try { await keyboard.connect(); } catch { /* shown in status */ }
  }

  async function handleDisconnect() {
    try { await keyboard.disconnect(); } catch { /* ignore */ }
  }

  async function handleSave() {
    try { await keyboard.saveSettings(); } catch { /* ignore */ }
  }

  async function handleReset() {
    if (confirm('Reset all thresholds to defaults?')) {
      try { await keyboard.resetDefaults(); } catch { /* ignore */ }
    }
  }

  async function handleToggleStream() {
    try {
      if (keyboard.streaming) await keyboard.stopStreaming();
      else await keyboard.startStreaming();
    } catch { /* ignore */ }
  }

  function keyIdForCol(col: number): string | null {
    if (col >= 0 && col <= 26) return `left:${col}`;
    if (col >= 28 && col <= 51) return `right:${col - 28}`;
    return null;
  }

  const selectedThreshold = $derived(
    keyboard.selectedCol !== null
      ? keyboard.thresholds.get(keyIdForCol(keyboard.selectedCol) ?? '')
      : undefined
  );

  const selectedADC = $derived(
    keyboard.selectedCol !== null
      ? keyboard.adcValues.get(keyIdForCol(keyboard.selectedCol) ?? '')
      : undefined
  );
</script>

<svelte:head>
  <title>HEball Configurator</title>
</svelte:head>

<div class="p-6 space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">HEball Configurator</h1>
    <span class="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
      HEball Configurator
    </span>
  </div>

  {#if !webSerialSupported}
    <div class="bg-yellow-900 border border-yellow-600 rounded p-4 text-yellow-200">
      ⚠️ WebSerial API is not supported in this browser. Please use Chrome or Edge.
    </div>
  {/if}

  <Toolbar
    connected={keyboard.transport.connected}
    streaming={keyboard.streaming}
    status={keyboard.status}
    onConnect={handleConnect}
    onDisconnect={handleDisconnect}
    onSave={handleSave}
    onReset={handleReset}
    onToggleStream={handleToggleStream}
  />

  {#if keyboard.transport.lastError}
    <p class="text-red-500 text-sm">{keyboard.transport.lastError}</p>
  {/if}

  <div class="overflow-x-auto">
    <KeyboardView
      thresholds={keyboard.thresholds}
      adcValues={keyboard.adcValues}
      selectedCol={keyboard.selectedCol}
      onSelectKey={(col) => { keyboard.selectedCol = col; }}
    />
  </div>

  <ThresholdEditor
    selectedKey={keyboard.selectedCol !== null ? { col: keyboard.selectedCol } : null}
    threshold={selectedThreshold}
    adcData={selectedADC}
    onSetThreshold={(p, r) => {
      if (keyboard.selectedCol !== null) {
        keyboard.setThreshold(keyboard.selectedCol, p, r);
      }
    }}
  />
</div>
