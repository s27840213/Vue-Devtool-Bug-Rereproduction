<template lang="pug">
div(class="ios-event-tester")
  div(class="ios-event-tester__send-event")
    div(class="ios-event-tester__title") SEND EVENT
    div(class="ios-event-tester__event")
      div(class="ios-event-tester__label") Event Name:
      input
    textarea(class="ios-event-tester__params" rows="5")
    nubtn(class="ios-event-tester__submit"
      theme="ghost"
      size="sm") SEND
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.ios-event-tester {
  @include size(100%, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: setColor(gray-1);
  &__send-event {
    width: 70vw;
    padding: 16px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
    justify-content: center;
    background: setColor(blue-1);
    filter: drop-shadow(0px 0px 15px setColor(white, 0.3));
  }
  &__title {
    align-self: center;
    @include text-H5;
    color: white;
  }
  &__label {
    margin-left: 4px;
    @include body-MD;
    color: white;
    white-space: nowrap;
  }
  &__event {
    width: 100%;
    display: flex;
    gap: 8px;
    & > input {
      width: 100%;
      border-radius: 5px;
      background: setColor(gray-2);
      color: white;
    }
  }
  &__params {
    width: 100%;
    border-radius: 5px;
    box-sizing: border-box;
    resize: none;
    background: setColor(gray-2);
    color: white;
    &:focus {
      outline: none;
    }
  }
}
</style>
