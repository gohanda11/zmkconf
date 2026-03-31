<script lang="ts">
  let {
    connected,
    streaming,
    status,
    onConnect,
    onDisconnect,
    onSave,
    onReset,
    onToggleStream
  }: {
    connected: boolean;
    streaming: boolean;
    status: string;
    onConnect: () => void;
    onDisconnect: () => void;
    onSave: () => void;
    onReset: () => void;
    onToggleStream: () => void;
  } = $props();
</script>

<div class="flex items-center gap-3 flex-wrap">
  {#if !connected}
    <button onclick={onConnect}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
      Connect
    </button>
  {:else}
    <button onclick={onDisconnect}
      class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium">
      Disconnect
    </button>
    <button onclick={onSave}
      class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium">
      Save to NVS
    </button>
    <button onclick={onReset}
      class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium">
      Reset Defaults
    </button>
    <button onclick={onToggleStream}
      class="px-4 py-2 {streaming ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded font-medium">
      {streaming ? 'Stop ADC Stream' : 'Start ADC Stream'}
    </button>
  {/if}
  <span class="text-gray-400 text-sm">{status}</span>
</div>
