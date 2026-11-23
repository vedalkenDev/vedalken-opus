<script lang="ts">
 import { additionalWork } from '#lib/projects.ts';
</script>
<a href="/work">← Work</a>
<h1>Earlier web work</h1>
<p>Websites designed and built with the Cerebro Creative team.</p>
<ul>
 {#each additionalWork.filter((item) => item.graphic !== 'agents') as item}
  <li><a href="/work/more/{item.slug}">{item.title}</a><p>{item.summary}</p></li>
 {/each}
</ul>
<style>a { display: inline-flex; align-items: center; min-height: 44px; } li { margin-block: 1rem; } li p { margin: 0; }</style>
