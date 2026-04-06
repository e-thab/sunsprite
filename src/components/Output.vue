<script setup lang="ts">
import { onMounted, ref } from 'vue';

// const panel = ref<HTMLElement>()

// function print(msg: string) {
//     console.log(msg)

//     const item = document.createElement('div')
//     item.className = 'output-item'
//     item.textContent = msg
//     document.querySelector('#output-panel')?.appendChild(item)
// }

// onMounted(() => {
//     for (let i = 0; i < 20; i++) {
//         print(`Print test ${i}`)
//     }
// })

</script>


<template>
    <div class="output-wrapper">
        <div class="output-header">Output</div>
        <!-- <hr style="border-color: #252525; border-style:solid"> -->
        <div class="output-panel" id="output-panel" ref="panel">
            <!-- <div class="output-item">Item 1</div>
            <div class="output-item">Item 2</div>
            <div class="output-item">Item 3</div>
            <div class="output-item">Item 4</div>
            <div class="output-item">Item 5</div> -->
        </div>
    </div>
</template>


<style>
.output-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}

.output-header {
    background-color: #0c0c0c;
}

.output-panel {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.output-item {
    display: flex;
    justify-content: space-between;
    font-family: 'Courier New', Courier, monospace;
    border-bottom: 1px solid #242424;
}

/* .output-msg {
    color: red;
} */

.output-stamp {
    color: DimGray;
}
</style>