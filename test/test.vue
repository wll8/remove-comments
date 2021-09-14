<template>
  <div class="box">
    <!-- <div>
      <span>多行文本</span>
      <span>多行文本</span>
    </div> -->
    <div>
      这是一些文本
      <!-- html注释 -->
    </div>
  </div>
</template>

<script>
  /**
   * 这是一个函数
   */
  function fn(){
    const num = 1 // 数字
  }
  export default {
    data() {
      return {
        msg: `hi`, // 这是一个消息
      }
    }
  };
</script>

<style>
/* 设置 body 的样式 */
body {
  margin: 0;
  padding: 0;
}
</style>
