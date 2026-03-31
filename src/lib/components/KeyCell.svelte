<script lang="ts">
  import type { LayoutKey, KeyThreshold, KeyADCData } from '$lib/keyboard/types';
  import { globalColToLocalIndex } from '$lib/keyboard/layout';

  let {
    key,
    selected = false,
    threshold,
    adcData,
    onclick
  }: {
    key: LayoutKey;
    selected?: boolean;
    threshold?: KeyThreshold;
    adcData?: KeyADCData;
    onclick?: () => void;
  } = $props();

  const loc = $derived(globalColToLocalIndex(key.col));
  const isConfigurable = $derived(loc?.half === 'right');

  function thresholdColor(t?: KeyThreshold) {
    if (!t) return 'bg-gray-700';
    const level = t.press / 255;
    if (level < 0.3) return 'bg-blue-900';
    if (level < 0.6) return 'bg-blue-700';
    return 'bg-blue-500';
  }
</script>

<button
  class="w-full h-full rounded text-xs font-mono border transition-all
    {selected ? 'border-green-400 ring-2 ring-green-400' : 'border-gray-600'}
    {isConfigurable ? thresholdColor(threshold) + ' hover:brightness-125 cursor-pointer' : 'bg-gray-800 opacity-40 cursor-not-allowed'}
    text-white"
  disabled={!isConfigurable}
  {onclick}
>
  {#if adcData && isConfigurable}
    <span class="block text-[9px] text-green-300">{adcData.distance}</span>
  {:else}
    <span class="block text-[9px] text-gray-400">{key.col}</span>
  {/if}
</button>
