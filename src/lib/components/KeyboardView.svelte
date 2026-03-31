<script lang="ts">
  import { HEBALL_LAYOUT, globalColToLocalIndex } from '$lib/keyboard/layout';
  import KeyCell from './KeyCell.svelte';
  import type { KeyThreshold, KeyADCData } from '$lib/keyboard/types';

  let {
    thresholds,
    adcValues,
    selectedCol,
    onSelectKey
  }: {
    thresholds: Map<string, KeyThreshold>;
    adcValues: Map<string, KeyADCData>;
    selectedCol: number | null;
    onSelectKey: (col: number) => void;
  } = $props();

  const UNIT = 4; // em per key unit

  function keyIdDirect(col: number): string | null {
    const loc = globalColToLocalIndex(col);
    return loc ? `${loc.half}:${loc.index}` : null;
  }
</script>

<div class="relative" style="height: 24em; min-width: 60em;">
  {#each HEBALL_LAYOUT as key (key.col)}
    {@const id = keyIdDirect(key.col)}
    <div
      class="absolute"
      style="
        left: {key.x * UNIT}em;
        top: {key.y * UNIT}em;
        width: {UNIT}em;
        height: {UNIT}em;
        padding: 2px;
        {key.r ? `transform: rotate(${key.r}deg); transform-origin: ${((key.rx ?? key.x) - key.x) * UNIT}em ${((key.ry ?? key.y) - key.y) * UNIT}em;` : ''}
      "
    >
      <KeyCell
        {key}
        selected={selectedCol === key.col}
        threshold={id ? thresholds.get(id) : undefined}
        adcData={id ? adcValues.get(id) : undefined}
        onclick={() => onSelectKey(key.col)}
      />
    </div>
  {/each}
</div>
