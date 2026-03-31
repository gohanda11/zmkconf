<script>
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-gray-900 text-white">
  {@render children()}
</div>
