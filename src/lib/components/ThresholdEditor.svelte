<script lang="ts">
  import type { KeyThreshold, KeyADCData } from '$lib/keyboard/types';

  let {
    selectedKey,
    threshold,
    adcData,
    onSetThreshold
  }: {
    selectedKey: { col: number; label?: string } | null;
    threshold?: KeyThreshold;
    adcData?: KeyADCData;
    onSetThreshold: (press: number, release: number) => void;
  } = $props();

  let pressVal = $derived(threshold?.press ?? 60);
  let releaseVal = $derived(threshold?.release ?? 30);
</script>

{#if selectedKey && threshold}
  <div class="bg-gray-800 rounded-lg p-4 space-y-3">
    <h3 class="text-white font-medium">Key col={selectedKey.col}</h3>

    <div>
      <label class="text-gray-400 text-sm">
        Press Threshold: {pressVal}
        <input
          type="range" min="1" max="255" value={pressVal}
          class="w-full accent-blue-500"
          oninput={(e) => {
            const p = parseInt((e.target as HTMLInputElement).value);
            if (p > releaseVal) onSetThreshold(p, releaseVal);
          }}
        />
      </label>
    </div>

    <div>
      <label class="text-gray-400 text-sm">
        Release Threshold: {releaseVal}
        <input
          type="range" min="1" max="255" value={releaseVal}
          class="w-full accent-blue-300"
          oninput={(e) => {
            const r = parseInt((e.target as HTMLInputElement).value);
            if (r < pressVal) onSetThreshold(pressVal, r);
          }}
        />
      </label>
    </div>

    {#if adcData}
      <div class="text-gray-400 text-sm space-y-1">
        <div>ADC: {adcData.adc} / 4095</div>
        <div class="w-full bg-gray-700 rounded h-2">
          <div class="bg-green-400 h-2 rounded" style="width: {(adcData.adc / 4095 * 100).toFixed(1)}%"></div>
        </div>
        <div>Distance: {adcData.distance} / 255</div>
      </div>
    {/if}
  </div>
{:else}
  <div class="bg-gray-800 rounded-lg p-4 text-gray-500 text-sm">
    Select a key on the keyboard to configure its threshold.
    <br>
    <span class="text-xs">(Right half keys only in Phase 3)</span>
  </div>
{/if}
