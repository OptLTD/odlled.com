<script setup>
import { computed } from 'vue'
import wechatImg from '../assets/wechat.png'

const props = defineProps({
  locale: { type: String, required: true },
})

const base = import.meta.env.BASE_URL
function asset(rel) {
  return `${base}Data/kdleds/template/${rel}`
}

const skypeImg = computed(() => asset('en/kf/skype.jpg'))
const qrCaption = computed(() => (props.locale === 'cn' ? '扫码加微信' : 'Scan Contact Us'))
</script>

<template>
  <!-- 原站 float0831：依赖 jQuery + kf/css.css + kf/common.css + kefu.js -->
  <div class="float0831" id="floatTools">
    <div class="floatL">
      <a
        href="javascript:void(0);"
        onclick="javascript:$('#divFloatToolsView').animate({width: 'show', opacity: 'show'}, 'normal',function(){ $('#divFloatToolsView').show();kf_setCookie('RightFloatShown', 0, '', '/', 'www.istudy.com.cn'); });$('#aFloatTools_Show').attr('style','display:none');$('#aFloatTools_Hide').attr('style','display:block');"
        title="查看在线客服"
        class="btnOpen"
        id="aFloatTools_Show"
        style="DISPLAY:"
        >展开</a>
      <a
        href="javascript:void(0);"
        onclick="javascript:$('#divFloatToolsView').animate({width: 'hide', opacity: 'hide'}, 'normal',function(){ $('#divFloatToolsView').hide();kf_setCookie('RightFloatShown', 1, '', '/', 'www.istudy.com.cn'); });$('#aFloatTools_Show').attr('style','display:block');$('#aFloatTools_Hide').attr('style','display:none');"
        title="关闭在线客服"
        class="btnCtn"
        id="aFloatTools_Hide"
        style="display:none"
        >收缩</a>
    </div>
    <div class="floatR" id="divFloatToolsView">
      <div class="tp"></div>
      <div class="cn">
        <template v-if="locale === 'en'">
          <ul>
            <li class="topp">
              <h3 class="titZx">在线咨询</h3>
            </li>
            <li>
              <a href="skype:Rebeca.xu1?chat">
                <img :src="skypeImg" width="21" height="21" border="0" alt="" style="margin:-6px 0;" /> 
                <span>Rebeca</span>
                </a>
            </li>
          </ul>
          <ul>
            <li>
              <span class="icoTl">86-13714118486</span>
            </li>
            <li style="height: 100px; text-align: center;">
              <img :src="wechatImg" width="100" height="100" alt="" decoding="async" />
            </li>
            <li style="height: 30px; text-align: center">
              {{ qrCaption }}
            </li>
          </ul>
        </template>
        <template v-else>
          <ul>
            <!-- <li class="topp">
              <h3 class="titZx">QQ咨询</h3>
            </li> -->
            <li><span class="icoZx">在线咨询</span></li>
            <li>
              <a
                class="icoTc"
                href="http://wpa.qq.com/msgrd?v=3&uin=3077866258&site=qq&menu=yes"
                target="_blank"
                >销售经理</a
              >
            </li>
            <li>
              <a
                class="icoTc"
                href="http://wpa.qq.com/msgrd?v=3&uin=2524768496&site=qq&menu=yes"
                target="_blank"
                >销售总监</a
              >
            </li>
          </ul>
          <ul>
            <!-- <li>
              <h3 class="titDh">电话咨询</h3>
            </li> -->
            <li><span class="icoTl">86-13714118486</span></li>
            <li style="height: 100px; text-align: center;">
              <img :src="wechatImg" width="100" height="100" alt="" decoding="async" />
            </li>
            <li style="height: 30px; text-align: center">{{ qrCaption }}</li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>
